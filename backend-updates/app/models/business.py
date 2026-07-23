"""
Negocio registrado en la plataforma (spa, barbería, restaurante...).
Cada negocio pertenece a un usuario con rol 'business_owner'.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(String(500))
    # Categorías de los mockups: 'medico', 'belleza', 'restaurante', 'gimnasio'...
    category = Column(String(50), index=True, nullable=False)
    address = Column(String(255))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="businesses")
    services = relationship("Service", back_populates="business", cascade="all, delete-orphan")
    hours = relationship("BusinessHours", back_populates="business", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="business")
