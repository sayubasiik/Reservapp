"""
Endpoints de negocios — incluye el endpoint estrella de disponibilidad.

Registrar en main.py:
    from app.routers import businesses
    app.include_router(businesses.router, prefix="/api/businesses", tags=["Negocios"])
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.business import Business
from app.models.user import User
from app.services.reservation_service import get_available_slots

router = APIRouter()


@router.get("")
def list_businesses(
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    """Listado público de negocios, con filtro por categoría y búsqueda por nombre."""
    query = db.query(Business).filter(Business.is_active == True)  # noqa: E712
    if category:
        query = query.filter(Business.category == category)
    if search:
        query = query.filter(Business.name.ilike(f"%{search}%"))
    return query.all()


@router.get("/{business_id}")
def get_business(business_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(
        Business.id == business_id, Business.is_active == True  # noqa: E712
    ).first()
    if business is None:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    return business


@router.get("/{business_id}/availability")
def availability(
    business_id: int,
    service_id: int = Query(..., description="Servicio a reservar"),
    day: date = Query(..., alias="date", description="Fecha YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Slots disponibles de un servicio en una fecha.
    Es el endpoint que alimenta la pantalla 'Selecciona un horario' del frontend.
    """
    return {
        "business_id": business_id,
        "service_id": service_id,
        "date": day.isoformat(),
        "slots": get_available_slots(db, business_id, service_id, day),
    }


def require_owner_of(business_id: int, user: User, db: Session) -> Business:
    """Helper: valida que el usuario autenticado sea dueño del negocio."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if business is None:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    if business.owner_id != user.id:
        raise HTTPException(status_code=403, detail="No eres dueño de este negocio")
    return business


@router.post("", status_code=201)
def create_business(
    payload: dict,  # TODO equipo: reemplazar por schema Pydantic BusinessCreate
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Crea un negocio; el usuario autenticado queda como dueño."""
    if user.role != "business_owner":
        raise HTTPException(status_code=403, detail="Se requiere cuenta de negocio")
    business = Business(owner_id=user.id, **payload)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business
