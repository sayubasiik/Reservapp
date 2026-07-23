"""
Endpoints de recursos reservables.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_business_manager
from app.models.business import Business
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceOut, ResourceUpdate
from app.services.reservation_service import check_availability

router = APIRouter()


def ensure_can_manage_business(current_user: User, business: Business) -> None:
    if current_user.role != "admin" and business.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para administrar este negocio",
        )


def ensure_can_manage_resource(
    current_user: User,
    resource: Resource,
) -> None:
    if current_user.role == "admin":
        return

    if not resource.business or resource.business.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para administrar este recurso",
        )


@router.get("/", response_model=list[ResourceOut])
def list_resources(
    category: str | None = None,
    business_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Lista recursos activos con filtros opcionales."""
    query = db.query(Resource).filter(
        Resource.is_active == True  # noqa: E712
    )

    if category:
        query = query.filter(Resource.category == category)

    if business_id is not None:
        query = query.filter(Resource.business_id == business_id)

    return query.all()


@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
):
    """Obtiene un recurso específico."""
    resource = db.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado",
        )

    return resource


@router.get("/{resource_id}/availability")
def get_availability(
    resource_id: int,
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
):
    """Consulta la disponibilidad del recurso."""
    available = check_availability(db, resource_id, start, end)

    return {
        "resource_id": resource_id,
        "start": start,
        "end": end,
        "available": available,
    }


@router.post(
    "/",
    response_model=ResourceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_manager),
):
    """Crea un recurso dentro de un negocio administrable."""
    business = db.get(Business, payload.business_id)

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado",
        )

    ensure_can_manage_business(current_user, business)

    if not business.is_active and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden agregar recursos a un negocio inactivo",
        )

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
    current_user: User = Depends(require_business_manager),
):
    """Actualiza un recurso propio o cualquier recurso si es admin."""
    resource = db.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado",
        )

    ensure_can_manage_resource(current_user, resource)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)

    db.commit()
    db.refresh(resource)

    return resource