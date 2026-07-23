"""
Reserva: un cliente reserva un servicio de un negocio en una fecha/hora.
Actualizado del modelo original: ahora referencia business + service.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)

    # 'pending' | 'confirmed' | 'cancelled' | 'completed'
    status = Column(String(20), default="confirmed", index=True)
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="reservations")
    business = relationship("Business", back_populates="reservations")
    service = relationship("Service", back_populates="reservations")
