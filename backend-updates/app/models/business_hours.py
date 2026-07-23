"""
Horario semanal de atención de cada negocio.
weekday: 0 = lunes ... 6 = domingo (convención de Python: date.weekday()).
Si un día no tiene registro, el negocio no abre ese día.
"""
from sqlalchemy import Column, Integer, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class BusinessHours(Base):
    __tablename__ = "business_hours"
    __table_args__ = (
        UniqueConstraint("business_id", "weekday", name="uq_business_weekday"),
    )

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False)   # 0=lunes ... 6=domingo
    opens_at = Column(Time, nullable=False)     # ej. 09:00
    closes_at = Column(Time, nullable=False)    # ej. 20:00

    business = relationship("Business", back_populates="hours")
