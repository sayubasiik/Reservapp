"""
Esquemas de validación para Reserva (Pydantic).
"""
from datetime import datetime
from pydantic import BaseModel, model_validator

from app.schemas.resource import ResourceOut


class ReservationCreate(BaseModel):
    resource_id: int
    start_time: datetime
    end_time: datetime
    notes: str | None = None

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time debe ser posterior a start_time")
        return self


class ReservationOut(BaseModel):
    id: int
    user_id: int
    resource_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: str | None
    created_at: datetime
    resource: ResourceOut | None = None

    class Config:
        from_attributes = True
