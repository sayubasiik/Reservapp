"""
Modelo de Negocio.
"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    name = Column(String(120), nullable=False, index=True)
    description = Column(String(500))
    category = Column(String(50), index=True)
    address = Column(String(250))
    phone = Column(String(30))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    owner = relationship("User", back_populates="businesses")
    resources = relationship("Resource", back_populates="business")