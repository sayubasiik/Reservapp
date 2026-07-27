"""
Modelo de Recurso reservable.
"""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Resource(Base):
    """
    Elemento reservable perteneciente a un negocio:
    sala, mesa, cancha, servicio, equipo, etc.
    """

    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=True,
        index=True,
    )
    name = Column(String(120), nullable=False)
    description = Column(String(500))
    category = Column(String(50), index=True)
    capacity = Column(Integer, default=1)
    price_per_hour = Column(Numeric(10, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    business = relationship("Business", back_populates="resources")
    reservations = relationship("Reservation", back_populates="resource")