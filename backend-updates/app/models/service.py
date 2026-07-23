"""
Servicio ofrecido por un negocio: 'Corte de cabello', 'Masaje 60 min', 'Mesa para 4'.
La duración del servicio determina cuánto bloquea en la agenda.
(Reemplaza al antiguo modelo genérico Resource.)
"""
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(String(500))
    duration_minutes = Column(Integer, nullable=False, default=60)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="services")
    reservations = relationship("Reservation", back_populates="service")
