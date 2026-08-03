import {
  useNavigate,
} from 'react-router-dom';

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
import './AdminDashboard.css';

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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  );
}

export default function AdminDashboard() {
  const navigate =
    useNavigate();

  const {
    summary,
    days,
    setDays,
    isLoading,
    error,
    reload,
  } =
    useDashboardSummary(30);

  const indicators =
    summary?.indicadores;

  return (
    <AdminLayout>
      <header className="ad__header">
        <div>
          <h1 className="ad__title">
            Dashboard
          </h1>

          <p className="db__subtitle">
            Indicadores y tendencias
            calculados con reservaciones
            reales.
          </p>
        </div>

        <div className="ad__header-actions">
          <label className="db__period">
            <span>Periodo</span>

            <select
              value={days}
              onChange={(event) =>
                setDays(
                  Number(
                    event.target.value,
                  ),
                )
              }
              disabled={isLoading}
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
            disabled={isLoading}
          >
            Actualizar
          </button>

          <button
            type="button"
            className="ad__btn"
            onClick={() =>
              navigate(
                '/admin/reportes',
              )
            }
          >
            Ver reportes
          </button>
        </div>
      </header>

      {isLoading && (
        <section
          className="db__state"
          role="status"
        >
          <span className="db__spinner" />

          <p>
            Cargando indicadores…
          </p>
        </section>
      )}

      {!isLoading &&
        error && (
          <section
            className="db__state db__state--error"
            role="alert"
          >
            <h2>
              No pudimos cargar el
              Dashboard
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
            <div className="db__meta">
              <span className="db__scope">
                {summary.alcance ===
                'global'
                  ? 'Vista global'
                  : 'Mi negocio'}
              </span>

              <span>
                Actualizado:{' '}
                {formatGeneratedAt(
                  summary.generado_en,
                )}
              </span>
            </div>

            <section
              className="db__stats"
              aria-label="Indicadores principales"
            >
              <article className="db__stat">
                <span>
                  Reservas totales
                </span>
                <strong>
                  {
                    indicators
                      .reservas_totales
                  }
                </strong>
                <small>
                  Historial visible
                </small>
              </article>

              <article className="db__stat">
                <span>
                  Reservas activas
                </span>
                <strong>
                  {
                    indicators
                      .reservas_activas
                  }
                </strong>
                <small>
                  Pendientes o confirmadas
                </small>
              </article>

              <article className="db__stat">
                <span>
                  Reservas próximas
                </span>
                <strong>
                  {
                    indicators
                      .reservas_proximas
                  }
                </strong>
                <small>
                  Con fecha futura
                </small>
              </article>

              <article className="db__stat">
                <span>
                  Ingreso estimado
                </span>
                <strong>
                  {formatCurrency(
                    indicators
                      .ingreso_estimado,
                  )}
                </strong>
                <small>
                  Horas por precio
                </small>
              </article>

              <article className="db__stat">
                <span>
                  Ingreso promedio
                </span>
                <strong>
                  {formatCurrency(
                    indicators
                      .ingreso_promedio,
                  )}
                </strong>
                <small>
                  Promedio por reserva
                </small>
              </article>
            </section>

            <section className="db__panel">
              <div className="db__panel-head">
                <div>
                  <h2>
                    Reservaciones por día
                  </h2>
                  <p>
                    Ventana analizada de{' '}
                    {summary.dias} días.
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

            <div className="db__grid">
              <section className="db__panel">
                <div className="db__panel-head">
                  <div>
                    <h2>
                      Distribución por estado
                    </h2>
                    <p>
                      Composición de las
                      reservaciones visibles.
                    </p>
                  </div>
                </div>

                <StatusDonut
                  items={
                    summary.por_estado
                  }
                />
              </section>

              <section className="db__panel">
                <div className="db__panel-head">
                  <div>
                    <h2>
                      Reservas por categoría
                    </h2>
                    <p>
                      Categorías con mayor
                      movimiento.
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

            <section className="db__panel">
              <div className="db__panel-head">
                <div>
                  <h2>
                    Recursos más reservados
                  </h2>
                  <p>
                    Clasificación basada en reservaciones no canceladas.
                  </p>
                </div>
              </div>

              <TopResources
                items={
                  summary.recursos_top
                }
              />
            </section>

            <div
              className="db__note"
              role="note"
            >
              Los ingresos son estimaciones
              calculadas con la duración y el
              precio por hora. ReservApp no
              procesa pagos en esta versión.
            </div>
          </>
        )}

      <footer className="ad__footer">
        Métricas administrativas de
        ReservApp
      </footer>
    </AdminLayout>
  );
}
