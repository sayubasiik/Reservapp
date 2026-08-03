import {
  apiClient,
} from './client';

export interface DashboardIndicators {
  reservas_totales: number;
  reservas_activas: number;
  reservas_proximas: number;
  ingreso_estimado: number | string;
  ingreso_promedio: number | string;
}

export interface DashboardStatusCount {
  estado: string;
  total: number;
}

export interface DashboardCategoryCount {
  categoria: string;
  total: number;
}

export interface DashboardDailyPoint {
  fecha: string;
  reservas: number;
}

export interface DashboardTopResource {
  recurso: string;
  reservas: number;
}

export interface DashboardSummary {
  generado_en: string;
  dias: number;
  alcance: 'global' | 'negocio' | string;
  indicadores: DashboardIndicators;
  por_estado: DashboardStatusCount[];
  por_categoria: DashboardCategoryCount[];
  reservas_por_dia: DashboardDailyPoint[];
  recursos_top: DashboardTopResource[];
}

export interface DashboardReportFile {
  blob: Blob;
  filename: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unwrapSummary(
  value: unknown,
): UnknownRecord {
  if (!isRecord(value)) {
    return {};
  }

  if (isRecord(value.summary)) {
    return value.summary;
  }

  if (isRecord(value.data)) {
    return value.data;
  }

  return value;
}

function numberValue(
  value: unknown,
): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function textValue(
  value: unknown,
  fallback: string,
): string {
  return typeof value === 'string' &&
    value.trim()
    ? value.trim()
    : fallback;
}

function safeDateTime(
  value: unknown,
): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return value;
    }
  }

  return new Date().toISOString();
}

function arrayValue(
  value: unknown,
): unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeDashboardSummary(
  value: unknown,
  requestedDays: number,
): DashboardSummary {
  const data = unwrapSummary(value);
  const indicators = isRecord(data.indicadores)
    ? data.indicadores
    : {};

  const porEstado = arrayValue(
    data.por_estado,
  )
    .filter(isRecord)
    .map((item) => ({
      estado: textValue(
        item.estado,
        'sin_estado',
      ),
      total: numberValue(item.total),
    }));

  const porCategoria = arrayValue(
    data.por_categoria,
  )
    .filter(isRecord)
    .map((item) => ({
      categoria: textValue(
        item.categoria,
        'Sin categorÃ­a',
      ),
      total: numberValue(item.total),
    }));

  const reservasPorDia = arrayValue(
    data.reservas_por_dia,
  )
    .filter(isRecord)
    .flatMap((item) => {
      if (typeof item.fecha !== 'string') {
        return [];
      }

      const date = new Date(
        `${item.fecha}T12:00:00`,
      );
      if (Number.isNaN(date.getTime())) {
        return [];
      }

      return [{
        fecha: item.fecha,
        reservas: numberValue(
          item.reservas,
        ),
      }];
    });

  const recursosTop = arrayValue(
    data.recursos_top,
  )
    .filter(isRecord)
    .map((item) => ({
      recurso: textValue(
        item.recurso,
        'Recurso',
      ),
      reservas: numberValue(
        item.reservas,
      ),
    }));

  return {
    generado_en: safeDateTime(
      data.generado_en,
    ),
    dias:
      numberValue(data.dias) > 0
        ? numberValue(data.dias)
        : requestedDays,
    alcance: textValue(
      data.alcance,
      'negocio',
    ),
    indicadores: {
      reservas_totales: numberValue(
        indicators.reservas_totales,
      ),
      reservas_activas: numberValue(
        indicators.reservas_activas,
      ),
      reservas_proximas: numberValue(
        indicators.reservas_proximas,
      ),
      ingreso_estimado: numberValue(
        indicators.ingreso_estimado,
      ),
      ingreso_promedio: numberValue(
        indicators.ingreso_promedio,
      ),
    },
    por_estado: porEstado,
    por_categoria: porCategoria,
    reservas_por_dia: reservasPorDia,
    recursos_top: recursosTop,
  };
}

function reportFilename(
  contentDisposition: unknown,
): string {
  if (
    typeof contentDisposition !==
    'string'
  ) {
    return 'reporte-reservas.pdf';
  }

  const utfMatch =
    /filename\*=UTF-8''([^;]+)/i.exec(
      contentDisposition,
    );

  if (utfMatch?.[1]) {
    return decodeURIComponent(
      utfMatch[1].replace(
        /^["']|["']$/g,
        '',
      ),
    );
  }

  const simpleMatch =
    /filename="?([^";]+)"?/i.exec(
      contentDisposition,
    );

  return (
    simpleMatch?.[1]?.trim() ||
    'reporte-reservas.pdf'
  );
}

export async function getDashboardSummary(
  days: number,
): Promise<DashboardSummary> {
  const response = await apiClient.get<unknown>(
    '/dashboard/summary',
    {
      params: { dias: days },
    },
  );

  return normalizeDashboardSummary(
    response.data,
    days,
  );
}

export async function getDashboardReport(
  days: number,
): Promise<DashboardReportFile> {
  const response = await apiClient.get<Blob>(
    '/dashboard/report.pdf',
    {
      params: { dias: days },
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    },
  );

  return {
    blob: response.data,
    filename: reportFilename(
      response.headers[
        'content-disposition'
      ],
    ),
  };
}