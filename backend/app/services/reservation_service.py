"""
Lógica de negocio de reservas.
La regla más importante: NO permitir traslapes en el mismo recurso.
"""
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.models.resource import Resource


def check_availability(
    db: Session,
    resource_id: int,
    start: datetime,
    end: datetime,
    exclude_reservation_id: int | None = None,
) -> bool:
    """
    Un traslape existe si: (inicio_existente < fin_nuevo) AND (fin_existente > inicio_nuevo).
    Solo cuentan reservas activas (pending/confirmed).
    Retorna True si está disponible, False si hay traslape.
    """
    query = db.query(Reservation).filter(
        Reservation.resource_id == resource_id,
        Reservation.status.in_(["pending", "confirmed"]),
        Reservation.start_time < end,
        Reservation.end_time > start,
    )
    if exclude_reservation_id:
        query = query.filter(Reservation.id != exclude_reservation_id)

    return query.first() is None


def create_reservation(
    db: Session, user_id: int, resource_id: int,
    start: datetime, end: datetime, notes: str | None = None,
) -> Reservation:
    """Crea una reserva verificando disponibilidad y validaciones."""
    resource = db.query(Resource).filter(
        Resource.id == resource_id, Resource.is_active == True  # noqa: E712
    ).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado o inactivo",
        )

    if not check_availability(db, resource_id, start, end):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El recurso ya está reservado en ese horario",
        )

    reservation = Reservation(
        user_id=user_id,
        resource_id=resource_id,
        start_time=start,
        end_time=end,
        notes=notes,
        status="confirmed",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation: Reservation) -> Reservation:
    """Cancela una reserva existente."""
    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La reserva ya está cancelada",
        )
    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation
