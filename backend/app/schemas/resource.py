"""
Esquemas de validación para Recurso.
"""
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ResourceBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    capacity: int = Field(default=1, ge=1)
    price_per_hour: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=10,
        decimal_places=2,
    )


class ResourceCreate(ResourceBase):
    business_id: int = Field(gt=0)


class ResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    capacity: int | None = Field(default=None, ge=1)
    price_per_hour: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
    )
    is_active: bool | None = None


class ResourceOut(ResourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int | None
    is_active: bool