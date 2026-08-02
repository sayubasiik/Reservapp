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
  const response =
    await apiClient.get<DashboardSummary>(
      '/dashboard/summary',
      {
        params: {
          dias: days,
        },
      },
    );

  return response.data;
}

export async function getDashboardReport(
  days: number,
): Promise<DashboardReportFile> {
  const response =
    await apiClient.get<Blob>(
      '/dashboard/report.pdf',
      {
        params: {
          dias: days,
        },
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
