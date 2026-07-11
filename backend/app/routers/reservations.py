"""
Endpoints de reservas.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.services import reservation_service

router = APIRouter()


@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    payload: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear una reserva. Valida que el recurso esté disponible (sin traslapes)."""
    return reservation_service.create_reservation(
        db=db,
        user_id=current_user.id,
        resource_id=payload.resource_id,
        start=payload.start_time,
        end=payload.end_time,
        notes=payload.notes,
    )


@router.get("/me", response_model=list[ReservationOut])
def my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mis reservas (usuario autenticado)."""
    return (
        db.query(Reservation)
        .filter(Reservation.user_id == current_user.id)
        .order_by(Reservation.start_time.desc())
        .all()
    )


@router.get("/", response_model=list[ReservationOut])
def all_reservations(
    db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    """Todas las reservas — solo admin."""
    return db.query(Reservation).order_by(Reservation.start_time.desc()).all()


@router.delete("/{reservation_id}", response_model=ReservationOut)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancelar una reserva. El dueño o un admin pueden cancelarla."""
    reservation = db.query(Reservation).get(reservation_id)
    if not reservation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reserva no encontrada")

    if reservation.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "No puedes cancelar esta reserva"
        )
    return reservation_service.cancel_reservation(db, reservation)
