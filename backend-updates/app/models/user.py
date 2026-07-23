"""
Usuario de la plataforma. Dos roles:
  - 'customer'       → usuario final que reserva
  - 'business_owner' → dueño de negocio(s), administra servicios y horarios
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer")  # 'customer' | 'business_owner'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reservations = relationship("Reservation", back_populates="customer")
    businesses = relationship("Business", back_populates="owner")
