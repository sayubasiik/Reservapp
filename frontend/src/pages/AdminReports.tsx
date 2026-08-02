import {
  useState,
} from 'react';

import {
  getDashboardReport,
} from '../api/dashboard';

import {
  getApiError,
} from '../api/client';

import AdminLayout from '../components/AdminLayout';

import {
  CategoryBars,
  DailyReservationsChart,
  StatusDonut,
  TopResources,
} from '../dashboard/DashboardCharts';

import {
  useDashboardSummary,
} from '../dashboard/useDashboardSummary';

import '../styles/variables.css';
import './AdminReports.css';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 365, label: '365 días' },
];

function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
): number {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(
    numberValue(value),
  );
}

function formatGeneratedAt(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'full',
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  );
}

function saveBlob(
  blob: Blob,
  filename: string,
) {
  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  window.setTimeout(
    () =>
      URL.revokeObjectURL(url),
    1_000,
  );
}

export default function AdminReports() {
  const {
    summary,
    days,
    setDays,
    isLoading,
    error,
    reload,
  } =
    useDashboardSummary(30);

  const [
    isDownloading,
    setIsDownloading,
  ] =
    useState(false);

  const [
    downloadError,
    setDownloadError,
  ] =
    useState<string | null>(null);

  const downloadReport =
    async () => {
      try {
        setIsDownloading(true);
        setDownloadError(null);

        const report =
          await getDashboardReport(
            days,
          );

        saveBlob(
          report.blob,
          report.filename,
        );
      } catch (requestError) {
        setDownloadError(
          getApiError(requestError),
        );
      } finally {
        setIsDownloading(false);
      }
    };

  const indicators =
    summary?.indicadores;

  return (
    <AdminLayout>
      <header className="ad__header">
        <div>
          <h1 className="ad__title">
            Reportes
          </h1>

          <p className="rp__subtitle">
            Analiza las reservaciones y
            descarga un reporte PDF
            generado por el servidor.
          </p>
        </div>

        <div className="ad__header-actions">
          <label className="rp__period">
            <span>Periodo</span>

            <select
              value={days}
              onChange={(event) => {
                setDays(
                  Number(
                    event.target.value,
                  ),
                );

                setDownloadError(
                  null,
                );
              }}
              disabled={
                isLoading ||
                isDownloading
              }
            >
              {PERIOD_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="button"
            className="ad__btn ad__btn--ghost"
            onClick={() =>
              void reload()
            }
            disabled={
              isLoading ||
              isDownloading
            }
          >
            Actualizar
          </button>

          <button
            type="button"
            className="ad__btn"
            onClick={() =>
              void downloadReport()
            }
            disabled={
              isLoading ||
              isDownloading ||
              !summary
            }
          >
            {isDownloading
              ? 'Generando PDF…'
              : 'Descargar PDF'}
          </button>
        </div>
      </header>

      {downloadError && (
        <div
          className="rp__message rp__message--error"
          role="alert"
        >
          {downloadError}
        </div>
      )}

      {isLoading && (
        <section
          className="rp__state"
          role="status"
        >
          <span className="rp__spinner" />

          <p>
            Preparando el reporte…
          </p>
        </section>
      )}

      {!isLoading &&
        error && (
          <section
            className="rp__state rp__state--error"
            role="alert"
          >
            <h2>
              No pudimos cargar los
              reportes
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="ad__btn"
              onClick={() =>
                void reload()
              }
            >
              Reintentar
            </button>
          </section>
        )}

      {!isLoading &&
        !error &&
        summary &&
        indicators && (
          <>
            <section className="rp__summary">
              <div>
                <span>
                  Alcance
                </span>

                <strong>
                  {summary.alcance ===
                  'global'
                    ? 'Sistema completo'
                    : 'Mi negocio'}
                </strong>
              </div>

              <div>
                <span>
                  Ventana
                </span>

                <strong>
                  {summary.dias} días
                </strong>
              </div>

              <div>
                <span>
                  Generado
                </span>

                <strong>
                  {formatGeneratedAt(
                    summary.generado_en,
                  )}
                </strong>
              </div>
            </section>

            <section
              className="rp__kpis"
              aria-label="Indicadores del reporte"
            >
              <article className="rp__kpi">
                <span>
                  Reservas totales
                </span>
                <strong>
                  {
                    indicators
                      .reservas_totales
                  }
                </strong>
              </article>

              <article className="rp__kpi">
                <span>
                  Reservas activas
                </span>
                <strong>
                  {
                    indicators
                      .reservas_activas
                  }
                </strong>
              </article>

              <article className="rp__kpi">
                <span>
                  Próximas
                </span>
                <strong>
                  {
                    indicators
                      .reservas_proximas
                  }
                </strong>
              </article>

              <article className="rp__kpi">
                <span>
                  Ingreso estimado
                </span>
                <strong>
                  {formatCurrency(
                    indicators
                      .ingreso_estimado,
                  )}
                </strong>
              </article>

              <article className="rp__kpi">
                <span>
                  Ingreso promedio
                </span>
                <strong>
                  {formatCurrency(
                    indicators
                      .ingreso_promedio,
                  )}
                </strong>
              </article>
            </section>

            <section className="rp__panel">
              <div className="rp__panel-head">
                <div>
                  <h2>
                    Evolución de reservas
                  </h2>
                  <p>
                    Reservaciones registradas
                    dentro de la ventana
                    seleccionada.
                  </p>
                </div>
              </div>

              <DailyReservationsChart
                points={
                  summary
                    .reservas_por_dia
                }
              />
            </section>

            <div className="rp__grid">
              <section className="rp__panel">
                <div className="rp__panel-head">
                  <div>
                    <h2>
                      Estados
                    </h2>
                    <p>
                      Distribución de las
                      reservaciones.
                    </p>
                  </div>
                </div>

                <StatusDonut
                  items={
                    summary.por_estado
                  }
                />
              </section>

              <section className="rp__panel">
                <div className="rp__panel-head">
                  <div>
                    <h2>
                      Categorías
                    </h2>
                    <p>
                      Volumen por categoría
                      de recurso.
                    </p>
                  </div>
                </div>

                <CategoryBars
                  items={
                    summary.por_categoria
                  }
                />
              </section>
            </div>

            <section className="rp__panel">
              <div className="rp__panel-head">
                <div>
                  <h2>
                    Recursos destacados
                  </h2>
                  <p>
                    Los cinco recursos con
                    más reservaciones
                    activas.
                  </p>
                </div>
              </div>

              <TopResources
                items={
                  summary.recursos_top
                }
              />
            </section>

            <section className="rp__pdf-card">
              <div>
                <h2>
                  Reporte profesional en PDF
                </h2>
                <p>
                  El servidor genera el
                  documento con indicadores,
                  gráficas, recursos y la
                  nota sobre ingresos
                  estimados.
                </p>
              </div>

              <button
                type="button"
                className="ad__btn"
                onClick={() =>
                  void downloadReport()
                }
                disabled={
                  isDownloading
                }
              >
                {isDownloading
                  ? 'Generando PDF…'
                  : 'Descargar reporte'}
              </button>
            </section>

            <div
              className="rp__note"
              role="note"
            >
              Los importes son estimaciones
              basadas en la duración y el
              precio por hora. No representan
              pagos procesados por ReservApp.
            </div>
          </>
        )}

      <footer className="ad__footer">
        Reportes administrativos de
        ReservApp
      </footer>
    </AdminLayout>
  );
}
