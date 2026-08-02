import type {
  DashboardCategoryCount,
  DashboardDailyPoint,
  DashboardStatusCount,
  DashboardTopResource,
} from '../api/dashboard';

import './DashboardCharts.css';

interface DonutSlice {
  label: string;
  value: number;
  tone: string;
}

const STATUS_TONES = [
  'var(--rv-navy)',
  'var(--rv-green)',
  'var(--rv-amber)',
  'var(--rv-red)',
  '#7C3AED',
  '#64748B',
];

const CATEGORY_TONES = [
  '#1E3A8A',
  '#2563EB',
  '#0F766E',
  '#7C3AED',
  '#B45309',
  '#475569',
];

function statusLabel(
  value: string,
): string {
  switch (
    value.trim().toLowerCase()
  ) {
    case 'pending':
      return 'Pendientes';
    case 'confirmed':
      return 'Confirmadas';
    case 'cancelled':
      return 'Canceladas';
    case 'completed':
      return 'Completadas';
    default:
      return value || 'Sin estado';
  }
}

function formatDayLabel(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function Donut({
  slices,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerLabel: string;
}) {
  const total =
    slices.reduce(
      (sum, slice) =>
        sum + slice.value,
      0,
    );

  const radius = 48;
  const circumference =
    2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="dc__donut-wrap">
      <svg
        className="dc__donut"
        viewBox="0 0 132 132"
        role="img"
        aria-label={
          `${centerLabel}: ${total}`
        }
      >
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="18"
        />

        {total > 0 &&
          slices.map((slice) => {
            const fraction =
              slice.value / total;

            const dash =
              Math.max(
                0,
                circumference *
                  fraction -
                  3,
              );

            const element = (
              <circle
                key={slice.label}
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke={slice.tone}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={
                  `${dash} ${
                    circumference -
                    dash
                  }`
                }
                strokeDashoffset={
                  -offset
                }
                transform={
                  'rotate(-90 66 66)'
                }
              />
            );

            offset +=
              circumference *
              fraction;

            return element;
          })}

        <text
          x="66"
          y="62"
          textAnchor="middle"
          className="dc__donut-value"
        >
          {total}
        </text>

        <text
          x="66"
          y="79"
          textAnchor="middle"
          className="dc__donut-label"
        >
          {centerLabel}
        </text>
      </svg>

      <ul className="dc__legend">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="dc__legend-item"
          >
            <span
              className="dc__legend-dot"
              style={{
                background:
                  slice.tone,
              }}
            />
            <span className="dc__legend-name">
              {slice.label}
            </span>
            <strong>
              {slice.value}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DailyReservationsChart({
  points,
}: {
  points: DashboardDailyPoint[];
}) {
  const maximum =
    Math.max(
      1,
      ...points.map(
        (point) =>
          point.reservas,
      ),
    );

  const labelStep =
    Math.max(
      1,
      Math.ceil(
        points.length / 8,
      ),
    );

  if (points.length === 0) {
    return (
      <p className="dc__empty">
        No hay datos diarios para este
        periodo.
      </p>
    );
  }

  return (
    <div
      className="dc__daily-scroll"
      role="img"
      aria-label="Reservaciones por día"
    >
      <div
        className="dc__daily"
        style={{
          minWidth:
            `${Math.max(
              520,
              points.length * 34,
            )}px`,
        }}
      >
        {points.map(
          (point, index) => (
            <div
              className="dc__daily-col"
              key={point.fecha}
            >
              <div className="dc__daily-track">
                <span
                  className="dc__daily-bar"
                  style={{
                    height:
                      `${
                        point.reservas === 0
                          ? 4
                          : Math.max(
                              10,
                              (
                                point.reservas /
                                maximum
                              ) *
                                100,
                            )
                      }%`,
                  }}
                />
                <span className="dc__tooltip">
                  {point.reservas}{' '}
                  {point.reservas === 1
                    ? 'reserva'
                    : 'reservas'}
                </span>
              </div>

              <span className="dc__daily-label">
                {index %
                  labelStep ===
                0
                  ? formatDayLabel(
                      point.fecha,
                    )
                  : ''}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function StatusDonut({
  items,
}: {
  items: DashboardStatusCount[];
}) {
  const slices =
    items.map(
      (item, index) => ({
        label:
          statusLabel(
            item.estado,
          ),
        value:
          item.total,
        tone:
          STATUS_TONES[
            index %
              STATUS_TONES.length
          ],
      }),
    );

  if (slices.length === 0) {
    return (
      <p className="dc__empty">
        No hay estados registrados.
      </p>
    );
  }

  return (
    <Donut
      slices={slices}
      centerLabel="reservas"
    />
  );
}

export function CategoryBars({
  items,
}: {
  items: DashboardCategoryCount[];
}) {
  const maximum =
    Math.max(
      1,
      ...items.map(
        (item) =>
          item.total,
      ),
    );

  if (items.length === 0) {
    return (
      <p className="dc__empty">
        No hay categorías registradas.
      </p>
    );
  }

  return (
    <ul className="dc__hbars">
      {items.map(
        (item, index) => (
          <li
            className="dc__hbar"
            key={item.categoria}
          >
            <div className="dc__hbar-head">
              <span>
                {item.categoria}
              </span>
              <strong>
                {item.total}
              </strong>
            </div>

            <span className="dc__hbar-track">
              <span
                className="dc__hbar-fill"
                style={{
                  width:
                    `${
                      (
                        item.total /
                        maximum
                      ) *
                      100
                    }%`,
                  background:
                    CATEGORY_TONES[
                      index %
                        CATEGORY_TONES.length
                    ],
                }}
              />
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

export function TopResources({
  items,
}: {
  items: DashboardTopResource[];
}) {
  const maximum =
    Math.max(
      1,
      ...items.map(
        (item) =>
          item.reservas,
      ),
    );

  if (items.length === 0) {
    return (
      <p className="dc__empty">
        Aún no hay recursos con
        reservaciones activas.
      </p>
    );
  }

  return (
    <ol className="dc__ranking">
      {items.map(
        (item, index) => (
          <li
            className="dc__ranking-item"
            key={
              `${item.recurso}-${index}`
            }
          >
            <span className="dc__ranking-number">
              {index + 1}
            </span>

            <div className="dc__ranking-body">
              <div className="dc__ranking-head">
                <span>
                  {item.recurso}
                </span>
                <strong>
                  {item.reservas}{' '}
                  {item.reservas === 1
                    ? 'reserva'
                    : 'reservas'}
                </strong>
              </div>

              <span className="dc__ranking-track">
                <span
                  className="dc__ranking-fill"
                  style={{
                    width:
                      `${
                        (
                          item.reservas /
                          maximum
                        ) *
                        100
                      }%`,
                  }}
                />
              </span>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}
