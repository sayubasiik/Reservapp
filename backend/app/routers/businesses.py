"""
Endpoints para administrar negocios.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_business_manager
from app.models.business import Business
from app.models.user import User
from app.schemas.business import BusinessCreate, BusinessOut, BusinessUpdate

router = APIRouter()


def get_business_or_404(db: Session, business_id: int) -> Business:
    business = db.get(Business, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado",
        )
    return business


def ensure_can_manage_business(current_user: User, business: Business) -> None:
    if current_user.role != "admin" and business.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para administrar este negocio",
        )


@router.get("/", response_model=list[BusinessOut])
def list_businesses(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """Lista públicamente los negocios activos."""
    query = db.query(Business).filter(
        Business.is_active == True  # noqa: E712
    )

    if category:
        query = query.filter(Business.category == category)

    return query.all()


@router.get("/{business_id}", response_model=BusinessOut)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
):
    """Obtiene un negocio activo."""
    business = get_business_or_404(db, business_id)

    if not business.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado",
        )

    return business


@router.post(
    "/",
    response_model=BusinessOut,
    status_code=status.HTTP_201_CREATED,
)
def create_business(
    payload: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_manager),
):
    """Crea un negocio para el propietario indicado."""
    if current_user.role == "admin":
        if payload.owner_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Un administrador debe indicar owner_id",
            )

        owner = db.get(User, payload.owner_id)
        if not owner or owner.role != "business_owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El propietario indicado no es válido",
            )

        owner_id = owner.id
    else:
        if payload.owner_id not in {None, current_user.id}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes crear negocios para otro usuario",
            )

        owner_id = current_user.id

    business_data = payload.model_dump(exclude={"owner_id"})
    business = Business(owner_id=owner_id, **business_data)

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


@router.patch("/{business_id}", response_model=BusinessOut)
def update_business(
    business_id: int,
    payload: BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_manager),
):
    """Actualiza un negocio propio o cualquier negocio si es admin."""
    business = get_business_or_404(db, business_id)
    ensure_can_manage_business(current_user, business)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(business, field, value)

    db.commit()
    db.refresh(business)

    return business