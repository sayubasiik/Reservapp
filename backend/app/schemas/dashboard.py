"""
Esquemas de respuesta del panel administrativo.

Definirlos explicitamente hace que FastAPI documente el endpoint en Swagger
y valide la salida, en lugar de devolver un diccionario sin contrato.
"""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class Indicadores(BaseModel):
    """Cifras principales que se muestran como tarjetas en el panel."""
    reservas_totales: int
    reservas_activas: int
    reservas_proximas: int
    ingreso_estimado: Decimal
    ingreso_promedio: Decimal


class ConteoEstado(BaseModel):
    estado: str
    total: int


class ConteoCategoria(BaseModel):
    categoria: str
    total: int


class PuntoDiario(BaseModel):
    """Un punto de la grafica de reservas por dia."""
    fecha: date
    reservas: int


class UsoRecurso(BaseModel):
    recurso: str
    reservas: int


class ResumenDashboard(BaseModel):
    generado_en: datetime
    dias: int
    alcance: str
    indicadores: Indicadores
    por_estado: list[ConteoEstado]
    por_categoria: list[ConteoCategoria]
    reservas_por_dia: list[PuntoDiario]
    recursos_top: list[UsoRecurso]
