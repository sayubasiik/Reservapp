"""
Modelo de Usuario.
"""
from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="client")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    reservations = relationship("Reservation", back_populates="user")
    businesses = relationship("Business", back_populates="owner")