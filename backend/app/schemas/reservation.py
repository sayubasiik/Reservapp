"""
Esquemas de validación para Reserva (Pydantic).
"""
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.resource import ResourceOut


class ReservationCreate(BaseModel):
    resource_id: int
    start_time: datetime
    end_time: datetime
    notes: str | None = None

    @model_validator(mode="after")
    def validate_times(self):
        if self.start_time.tzinfo is None or self.end_time.tzinfo is None:
            raise ValueError(
                "start_time y end_time deben incluir zona horaria"
            )

        if self.end_time <= self.start_time:
            raise ValueError(
                "end_time debe ser posterior a start_time"
            )

        if self.start_time <= datetime.now(timezone.utc):
            raise ValueError(
                "start_time debe ser una fecha futura"
            )

        return self


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    resource_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: str | None
    created_at: datetime
    resource: ResourceOut | None = None