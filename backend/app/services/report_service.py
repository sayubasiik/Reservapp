"""
Generacion del reporte PDF con ReportLab.

El PDF se arma en memoria y se devuelve como bytes: no se escribe a disco,
porque el contenedor de Azure tiene sistema de archivos efimero y no habria
donde guardarlo de forma confiable.
"""
from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie

from app.models.user import User

AZUL = colors.HexColor("#1E3A8A")
GRIS = colors.HexColor("#E5E7EB")
GRIS_TEXTO = colors.HexColor("#4B5563")

PALETA = [
    colors.HexColor("#1E3A8A"),
    colors.HexColor("#2563EB"),
    colors.HexColor("#60A5FA"),
    colors.HexColor("#93C5FD"),
    colors.HexColor("#BFDBFE"),
]


def _estilos():
    hojas = getSampleStyleSheet()
    return {
        "titulo": ParagraphStyle(
            "titulo", parent=hojas["Title"], fontSize=20, textColor=AZUL,
            spaceAfter=4,
        ),
        "subtitulo": ParagraphStyle(
            "subtitulo", parent=hojas["Normal"], fontSize=10,
            textColor=GRIS_TEXTO, alignment=TA_CENTER, spaceAfter=16,
        ),
        "seccion": ParagraphStyle(
            "seccion", parent=hojas["Heading2"], fontSize=13, textColor=AZUL,
            spaceBefore=14, spaceAfter=8,
        ),
        "texto": ParagraphStyle(
            "texto", parent=hojas["Normal"], fontSize=9.5,
            textColor=GRIS_TEXTO, leading=14,
        ),
    }


def _tabla_indicadores(indicadores: dict) -> Table:
    """Las cifras principales, en dos columnas."""
    filas = [
        ["Indicador", "Valor"],
        ["Reservas totales", str(indicadores["reservas_totales"])],
        ["Reservas activas", str(indicadores["reservas_activas"])],
        ["Reservas proximas", str(indicadores["reservas_proximas"])],
        ["Ingreso estimado", f"$ {indicadores['ingreso_estimado']:,.2f}"],
        ["Ingreso promedio por reserva", f"$ {indicadores['ingreso_promedio']:,.2f}"],
    ]

    tabla = Table(filas, colWidths=[10 * cm, 6 * cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.4, GRIS),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tabla


def _grafica_barras(serie: list[dict]) -> Drawing:
    """
    Reservas por dia. Se muestran los ultimos 14 puntos: con 30 las etiquetas
    se encimarian y la grafica dejaria de leerse.
    """
    # Se centra la ventana visible alrededor de los dias con actividad, para
    # que la grafica no salga vacia cuando las reservas estan agrupadas.
    if len(serie) > 14:
        indices = [i for i, p in enumerate(serie) if p["reservas"] > 0]
        if indices:
            centro = (indices[0] + indices[-1]) // 2
            inicio_ventana = max(0, min(centro - 7, len(serie) - 14))
            puntos = serie[inicio_ventana:inicio_ventana + 14]
        else:
            puntos = serie[:14]
    else:
        puntos = serie
    valores = [p["reservas"] for p in puntos]
    etiquetas = [p["fecha"].strftime("%d/%m") for p in puntos]

    dibujo = Drawing(440, 180)
    grafica = VerticalBarChart()
    grafica.x = 35
    grafica.y = 30
    grafica.height = 125
    grafica.width = 385
    grafica.data = [valores]
    grafica.bars[0].fillColor = AZUL
    grafica.valueAxis.valueMin = 0
    # Sin esto, una serie de puros ceros genera un eje degenerado y ReportLab falla.
    grafica.valueAxis.valueMax = max(valores) + 1 if any(valores) else 1
    grafica.categoryAxis.categoryNames = etiquetas
    grafica.categoryAxis.labels.angle = 45
    grafica.categoryAxis.labels.dy = -8
    grafica.categoryAxis.labels.fontSize = 7
    dibujo.add(grafica)
    return dibujo


def _grafica_pastel(por_categoria: list[dict]) -> Drawing:
    """Distribucion de reservas por categoria de recurso."""
    datos = por_categoria[:5]
    dibujo = Drawing(440, 170)

    pastel = Pie()
    pastel.x = 150
    pastel.y = 15
    pastel.width = 135
    pastel.height = 135
    pastel.data = [d["total"] for d in datos]
    pastel.labels = [f"{d['categoria']} ({d['total']})" for d in datos]
    pastel.sideLabels = True
    pastel.slices.strokeWidth = 0.5
    pastel.slices.fontSize = 8

    for indice in range(len(datos)):
        pastel.slices[indice].fillColor = PALETA[indice % len(PALETA)]

    dibujo.add(pastel)
    return dibujo


def _tabla_recursos(recursos: list[dict]) -> Table:
    filas = [["Recurso", "Reservas"]]
    filas += [[r["recurso"], str(r["reservas"])] for r in recursos]

    tabla = Table(filas, colWidths=[12 * cm, 4 * cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.4, GRIS),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tabla


def generar_pdf_reservas(resumen: dict, usuario: User) -> bytes:
    """
    Construye el PDF completo y lo devuelve como bytes listos para descargar.
    """
    buffer = BytesIO()
    documento = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        title="Reporte de reservas - ReservApp",
    )
    estilo = _estilos()
    alcance = (
        "Todo el sistema" if resumen["alcance"] == "global"
        else "Negocios del usuario"
    )
    generado = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    elementos = [
        Paragraph("ReservApp — Reporte de reservas", estilo["titulo"]),
        Paragraph(
            f"Alcance: {alcance} &nbsp;·&nbsp; Periodo: ultimos "
            f"{resumen['dias']} dias &nbsp;·&nbsp; Generado: {generado}",
            estilo["subtitulo"],
        ),

        Paragraph("Indicadores principales", estilo["seccion"]),
        _tabla_indicadores(resumen["indicadores"]),

        Paragraph("Reservas por dia", estilo["seccion"]),
        Paragraph(
            "Numero de reservas registradas por fecha de inicio. Se muestra "
            "una ventana de 14 dias centrada en el periodo con actividad, "
            "para conservar la legibilidad de las etiquetas.",
            estilo["texto"],
        ),
        Spacer(1, 6),
        _grafica_barras(resumen["reservas_por_dia"]),
    ]

    if resumen["por_categoria"]:
        elementos += [
            Paragraph("Distribucion por categoria", estilo["seccion"]),
            _grafica_pastel(resumen["por_categoria"]),
        ]

    if resumen["recursos_top"]:
        elementos += [
            Paragraph("Recursos mas reservados", estilo["seccion"]),
            _tabla_recursos(resumen["recursos_top"]),
        ]

    elementos += [
        Spacer(1, 18),
        Paragraph(
            "Los ingresos son una estimacion calculada como horas reservadas "
            "por el precio por hora del recurso. El sistema no procesa pagos, "
            "por lo que estas cifras no representan cobros efectuados. "
            "Las reservas canceladas se excluyen de los ingresos y de la "
            "ocupacion.",
            estilo["texto"],
        ),
    ]

    documento.build(elementos)
    return buffer.getvalue()
