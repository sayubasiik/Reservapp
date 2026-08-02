"""
Panel administrativo y reportes.

El control de acceso usa require_business_manager: solo propietarios de negocio
y administradores entran. El alcance de los datos lo resuelve el servicio segun
el rol, asi que un propietario nunca ve informacion de otro negocio.
"""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_business_manager
from app.models.user import User
from app.schemas.dashboard import ResumenDashboard
from app.services.dashboard_service import construir_resumen
from app.services.report_service import generar_pdf_reservas

router = APIRouter()


@router.get("/summary", response_model=ResumenDashboard)
def obtener_resumen(
    dias: int = Query(30, ge=1, le=365, description="Ventana del historial diario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_manager),
):
    """
    Indicadores, distribuciones y series para el panel administrativo.

    Un administrador ve el sistema completo; un propietario de negocio ve
    unicamente las reservas de los recursos que le pertenecen.
    """
    return construir_resumen(db, current_user, dias=dias)


@router.get(
    "/report.pdf",
    response_class=Response,
    responses={200: {"content": {"application/pdf": {}}}},
)
def descargar_reporte(
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_manager),
):
    """
    Reporte en PDF con las mismas metricas del panel, incluyendo grafica.

    Se devuelve como descarga (Content-Disposition: attachment) para que el
    navegador guarde el archivo en lugar de intentar mostrarlo.
    """
    resumen = construir_resumen(db, current_user, dias=dias)
    contenido = generar_pdf_reservas(resumen, current_user)

    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="reporte-reservas.pdf"'
        },
    )
