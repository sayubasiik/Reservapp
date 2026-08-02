"""
Métricas del panel administrativo.

Separa el cálculo de las rutas: el router solo decide quién puede ver qué,
y este módulo se encarga de consultar y agregar los datos.
"""
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User

# Estados que representan una reserva vigente o cumplida.
# Una reserva cancelada no genera ingreso ni ocupa el recurso.
ESTADOS_ACTIVOS = ("pending", "confirmed", "completed")


def _asegurar_utc(valor: datetime) -> datetime:
    """
    Normaliza fechas a UTC.

    PostgreSQL devuelve fechas con zona horaria, pero SQLite (que usamos en las
    pruebas) las devuelve sin ella. Comparar ambos tipos lanza TypeError.
    """
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc)


def _filas_visibles(db: Session, usuario: User) -> list[tuple[Reservation, Resource]]:
    """
    Devuelve las reservas que el usuario puede ver, emparejadas con su recurso
    para calcular ingresos sin consultas adicionales.
    """
    consulta = db.query(Reservation, Resource).join(
        Resource, Reservation.resource_id == Resource.id
    )

    # Mismo criterio de propiedad que el router de negocios:
    # un admin ve todo; un propietario solo lo suyo.
    if usuario.role != "admin":
        consulta = consulta.join(
            Business, Resource.business_id == Business.id
        ).filter(Business.owner_id == usuario.id)

    return consulta.all()


def _calcular_ingreso(reserva: Reservation, recurso: Resource) -> Decimal:
    """
    Ingreso estimado: horas de uso por precio por hora.
    Es una estimacion, no un cobro: el sistema no procesa pagos todavia.
    """
    if reserva.status not in ESTADOS_ACTIVOS:
        return Decimal("0")

    inicio = _asegurar_utc(reserva.start_time)
    fin = _asegurar_utc(reserva.end_time)
    horas = Decimal((fin - inicio).total_seconds()) / Decimal("3600")
    precio = recurso.price_per_hour or Decimal("0")
    return (horas * precio).quantize(Decimal("0.01"))


def construir_resumen(db: Session, usuario: User, dias: int = 30) -> dict:
    """
    Arma el resumen completo del panel.

    El parametro `dias` define la ventana del historial diario; los totales
    consideran todas las reservas visibles, no solo las de la ventana.
    """
    filas = _filas_visibles(db, usuario)
    ahora = datetime.now(timezone.utc)
    # La ventana se centra en hoy: un sistema de reservas necesita mostrar
    # lo que viene, no solo lo que ya paso.
    dias_atras = max(1, dias // 4)
    desde = ahora - timedelta(days=dias_atras)
    hasta = ahora + timedelta(days=dias - dias_atras)

    total = len(filas)
    ingreso_total = Decimal("0")
    activas = 0
    proximas = 0
    por_estado: Counter[str] = Counter()
    por_categoria: Counter[str] = Counter()
    por_dia: defaultdict[date, int] = defaultdict(int)
    uso_recurso: Counter[str] = Counter()

    for reserva, recurso in filas:
        inicio = _asegurar_utc(reserva.start_time)
        estado = reserva.status or "desconocido"

        por_estado[estado] += 1
        por_categoria[recurso.category or "Sin categoria"] += 1
        ingreso_total += _calcular_ingreso(reserva, recurso)

        if estado in ESTADOS_ACTIVOS:
            activas += 1
            uso_recurso[recurso.name] += 1
            if inicio >= ahora:
                proximas += 1

        if desde <= inicio <= hasta:
            por_dia[inicio.date()] += 1

    # La serie diaria se rellena con ceros para que la grafica no tenga huecos
    # en los dias sin reservas.
    serie = []
    for desplazamiento in range(dias):
        dia = (desde + timedelta(days=desplazamiento)).date()
        serie.append({"fecha": dia, "reservas": por_dia.get(dia, 0)})

    promedio = (
        (ingreso_total / Decimal(total)).quantize(Decimal("0.01"))
        if total
        else Decimal("0")
    )

    return {
        "generado_en": ahora,
        "dias": dias,
        "alcance": "global" if usuario.role == "admin" else "negocio",
        "indicadores": {
            "reservas_totales": total,
            "reservas_activas": activas,
            "reservas_proximas": proximas,
            "ingreso_estimado": ingreso_total,
            "ingreso_promedio": promedio,
        },
        "por_estado": [
            {"estado": estado, "total": conteo}
            for estado, conteo in por_estado.most_common()
        ],
        "por_categoria": [
            {"categoria": categoria, "total": conteo}
            for categoria, conteo in por_categoria.most_common()
        ],
        "reservas_por_dia": serie,
        "recursos_top": [
            {"recurso": nombre, "reservas": conteo}
            for nombre, conteo in uso_recurso.most_common(5)
        ],
    }
