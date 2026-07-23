"""
Esquemas de validación para Negocio.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BusinessBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=250)
    phone: str | None = Field(default=None, max_length=30)


class BusinessCreate(BusinessBase):
    owner_id: int | None = Field(default=None, gt=0)


class BusinessUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=250)
    phone: str | None = Field(default=None, max_length=30)
    is_active: bool | None = None


class BusinessOut(BusinessBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    is_active: bool
    created_at: datetime