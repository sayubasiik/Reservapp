"""
Esquemas de validación para Recurso (Pydantic).
"""
from decimal import Decimal
from pydantic import BaseModel


class ResourceBase(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    capacity: int = 1
    price_per_hour: Decimal = Decimal("0")


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    capacity: int | None = None
    price_per_hour: Decimal | None = None
    is_active: bool | None = None


class ResourceOut(ResourceBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
