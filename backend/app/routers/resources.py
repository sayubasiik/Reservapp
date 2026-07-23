"""
Endpoints de recursos (salas, canchas, mesas, etc).
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceOut
from app.services.reservation_service import check_availability

router = APIRouter()


@router.get("/", response_model=list[ResourceOut])
def list_resources(
    category: str | None = None, db: Session = Depends(get_db)
):
    """Lista recursos activos, con filtro opcional por categoría. Público."""
    query = db.query(Resource).filter(Resource.is_active == True)  # noqa: E712
    if category:
        query = query.filter(Resource.category == category)
    return query.all()


@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """Obtiene un recurso específico."""
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurso no encontrado")
    return resource


@router.get("/{resource_id}/availability")
def get_availability(
    resource_id: int,
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
):
    """Consulta si un recurso está disponible en un rango de fechas."""
    available = check_availability(db, resource_id, start, end)
    return {"resource_id": resource_id, "start": start, "end": end, "available": available}


@router.post("/", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Crear recurso — solo admin."""
    resource = Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.patch("/{resource_id}", response_model=ResourceOut)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Actualizar recurso — solo admin."""
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurso no encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource
