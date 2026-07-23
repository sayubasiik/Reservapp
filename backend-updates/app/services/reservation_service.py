"""
Lógica de negocio de reservas (versión multi-negocio).

Reglas implementadas:
  1. La reserva debe caer dentro del horario de atención del negocio (business_hours).
  2. No se permiten traslapes con otras reservas activas del mismo negocio.
  3. La verificación + inserción se hace con lock (SELECT ... FOR UPDATE) dentro
     de la transacción para evitar condiciones de carrera (dos clientes pidiendo
     el mismo slot al mismo tiempo).
  4. Generación de slots disponibles para el endpoint de disponibilidad.
"""
from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.business_hours import BusinessHours
from app.models.reservation import Reservation
from app.models.service import Service

ACTIVE_STATUSES = ["pending", "confirmed"]


def _get_business_hours(db: Session, business_id: int, day: date) -> BusinessHours:
    """Horario del negocio para ese día de la semana; 400 si no abre."""
    hours = (
        db.query(BusinessHours)
        .filter(
            BusinessHours.business_id == business_id,
            BusinessHours.weekday == day.weekday(),  # 0=lunes ... 6=domingo
        )
        .first()
    )
    if hours is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El negocio no abre ese día",
        )
    return hours


def _overlapping_reservations(
    db: Session, business_id: int, start: datetime, end: datetime, for_update: bool = False
):
    """
    Reservas activas del negocio que se traslapan con [start, end).
    Regla de traslape: inicio_existente < fin_nuevo AND fin_existente > inicio_nuevo.
    """
    query = db.query(Reservation).filter(
        Reservation.business_id == business_id,
        Reservation.status.in_(ACTIVE_STATUSES),
        Reservation.start_time < end,
        Reservation.end_time > start,
    )
    if for_update:
        # Bloquea las filas candidatas hasta el commit → evita doble reserva
        query = query.with_for_update()
    return query.all()


def get_available_slots(
    db: Session, business_id: int, service_id: int, day: date
) -> list[dict]:
    """
    Genera los slots libres de un día para un servicio.
    Los slots se generan cada `duration_minutes` desde la apertura,
    y se descartan los que traslapan con reservas activas o ya pasaron.
    Alimenta: GET /api/businesses/{id}/availability?date=...&service_id=...
    """
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.business_id == business_id,
                Service.is_active == True)  # noqa: E712
        .first()
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    hours = _get_business_hours(db, business_id, day)
    duration = timedelta(minutes=service.duration_minutes)

    day_start = datetime.combine(day, hours.opens_at, tzinfo=timezone.utc)
    day_end = datetime.combine(day, hours.closes_at, tzinfo=timezone.utc)

    # Reservas del día una sola vez (más eficiente que consultar por slot)
    existing = _overlapping_reservations(db, business_id, day_start, day_end)
    now = datetime.now(timezone.utc)

    slots = []
    cursor = day_start
    while cursor + duration <= day_end:
        slot_end = cursor + duration
        overlaps = any(
            r.start_time < slot_end and r.end_time > cursor for r in existing
        )
        if not overlaps and cursor > now:
            slots.append(
                {"start": cursor.isoformat(), "end": slot_end.isoformat()}
            )
        cursor += duration
    return slots


def create_reservation(
    db: Session, customer_id: int, business_id: int, service_id: int,
    start: datetime, notes: str | None = None,
) -> Reservation:
    """Crea una reserva validando negocio activo, horario y traslapes."""
    business = db.query(Business).filter(
        Business.id == business_id, Business.is_active == True  # noqa: E712
    ).first()
    if business is None:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    service = db.query(Service).filter(
        Service.id == service_id, Service.business_id == business_id,
        Service.is_active == True,  # noqa: E712
    ).first()
    if service is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    end = start + timedelta(minutes=service.duration_minutes)

    # Regla 1: dentro del horario de atención
    hours = _get_business_hours(db, business_id, start.date())
    if start.time() < hours.opens_at or end.time() > hours.closes_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La reserva está fuera del horario de atención",
        )

    # Regla 2 + 3: sin traslapes, con lock para concurrencia
    if _overlapping_reservations(db, business_id, start, end, for_update=True):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese horario ya está reservado",
        )

    reservation = Reservation(
        customer_id=customer_id,
        business_id=business_id,
        service_id=service_id,
        start_time=start,
        end_time=end,
        status="confirmed",
        notes=notes,
    )
    db.add(reservation)
    db.commit()          # libera el lock
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation: Reservation) -> Reservation:
    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="La reserva ya está cancelada")
    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation
