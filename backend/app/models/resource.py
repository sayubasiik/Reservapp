"""
Modelo de Recurso reservable (sala, cancha, mesa, etc).
"""
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Resource(Base):
    """
    Recurso reservable genérico: una sala, mesa, cancha, habitación, equipo, etc.
    Al ser una app de reservas 'en general', este modelo es flexible.
    """
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(String(500))
    category = Column(String(50), index=True)  # ej. 'sala', 'cancha', 'mesa'
    capacity = Column(Integer, default=1)
    price_per_hour = Column(Numeric(10, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reservations = relationship("Reservation", back_populates="resource")
