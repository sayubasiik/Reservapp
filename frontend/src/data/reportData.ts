// Cálculos del Reporte del negocio (pantalla Admin → Reportes).
// Todo se arma con las reservas que ya tiene el negocio, así el reporte
// refleja lo que realmente pasó en la app.
// En producción el backend hará estos mismos agregados y además generará
// el PDF descargable (ver AdminReports.tsx).

import type { Reservation, ResStatus } from '../store/StoreContext';
import type { PayMethod } from './payments';
import { payMethods } from './payments';
import { addDaysISO, todayISO, MONTH_NAMES } from '../utils/datetime';

/* ---- Periodo del reporte ---- */
export type RangeKey = '7d' | '30d' | 'mes' | '90d' | 'anio';

export const rangePresets: { key: RangeKey; label: string }[] = [
  { key: '7d',   label: 'Últimos 7 días' },
  { key: '30d',  label: 'Últimos 30 días' },
  { key: 'mes',  label: 'Este mes' },
  { key: '90d',  label: 'Últimos 3 meses' },
  { key: 'anio', label: 'Este año' },
];

// Último día del mes (mm es 1-12).
const lastDayOfMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

export function rangeDates(key: RangeKey): { from: string; to: string } {
  const hoy = todayISO();
  const [y, m] = hoy.split('-').map(Number);
  switch (key) {
    case '7d':  return { from: addDaysISO(hoy, -6), to: hoy };
    case '30d': return { from: addDaysISO(hoy, -29), to: hoy };
    case '90d': return { from: addDaysISO(hoy, -89), to: hoy };
    // El mes y el año completos incluyen las reservas que aún están por venir.
    case 'mes': return {
      from: `${hoy.slice(0, 7)}-01`,
      to: `${hoy.slice(0, 7)}-${String(lastDayOfMonth(y, m)).padStart(2, '0')}`,
    };
    case 'anio': return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
}

// "2026-07-22" -> "22 Jul 2026" (compacto, para tablas y ejes)
export function shortDate(dateISO: string): string {
  if (!dateISO) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
}

export const money = (n: number) => `$${Math.round(n).toLocaleString('es-MX')}`;

/* ---- Resultado del reporte ---- */
export interface Bucket { key: string; label: string; count: number; revenue: number }
export interface NamedTotal { name: string; count: number; revenue: number }

export interface ReportData {
  from: string;
  to: string;
  rows: Reservation[];                 // reservas del periodo (más recientes primero)
  total: number;
  byStatus: Record<ResStatus, number>;
  revenue: number;                     // ingresos de las reservas no canceladas
  collected: number;                   // ya cobrado (tarjeta / PayPal)
  pending: number;                     // por cobrar (pago en el lugar)
  lost: number;                        // importe de las canceladas
  ticket: number;                      // ticket promedio
  clients: number;                     // clientes distintos
  cancelRate: number;                  // % de cancelación
  buckets: Bucket[];                   // serie de tiempo (por día o por mes)
  bucketUnit: 'día' | 'mes';
  byService: NamedTotal[];             // servicios ordenados por ingresos
  byMethod: { method: PayMethod; count: number; revenue: number }[];
  peakHour: string;                    // horario con más reservas
}

const daysBetween = (from: string, to: string) => {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
};

// Serie de tiempo: por día si el periodo es corto, por mes si es largo.
function makeBuckets(from: string, to: string): { buckets: Bucket[]; unit: 'día' | 'mes' } {
  const span = daysBetween(from, to);
  if (span <= 45) {
    const buckets: Bucket[] = [];
    for (let d = from; d <= to && buckets.length < 60; d = addDaysISO(d, 1)) {
      buckets.push({ key: d, label: String(Number(d.slice(8, 10))), count: 0, revenue: 0 });
    }
    return { buckets, unit: 'día' };
  }
  const buckets: Bucket[] = [];
  let [y, m] = from.split('-').map(Number);
  const [yTo, mTo] = to.split('-').map(Number);
  while ((y < yTo || (y === yTo && m <= mTo)) && buckets.length < 24) {
    buckets.push({
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: MONTH_NAMES[m - 1].slice(0, 3),
      count: 0,
      revenue: 0,
    });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return { buckets, unit: 'mes' };
}

export function buildReport(reservations: Reservation[], from: string, to: string): ReportData {
  const rows = reservations
    .filter((r) => r.date >= from && r.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const activas = rows.filter((r) => r.status !== 'cancelada');
  const importe = (r: Reservation) => r.total ?? 0;

  const byStatus: Record<ResStatus, number> = { confirmada: 0, pendiente: 0, cancelada: 0 };
  rows.forEach((r) => { byStatus[r.status] += 1; });

  const revenue = activas.reduce((n, r) => n + importe(r), 0);
  const pending = activas
    .filter((r) => r.payStatus === 'pendiente')
    .reduce((n, r) => n + importe(r), 0);

  // Serie de tiempo
  const { buckets, unit } = makeBuckets(from, to);
  const index = new Map(buckets.map((b) => [b.key, b]));
  activas.forEach((r) => {
    const b = index.get(unit === 'día' ? r.date : r.date.slice(0, 7));
    if (b) { b.count += 1; b.revenue += importe(r); }
  });

  // Ingresos por servicio
  const servicios = new Map<string, NamedTotal>();
  activas.forEach((r) => {
    const acc = servicios.get(r.serviceName) ?? { name: r.serviceName, count: 0, revenue: 0 };
    acc.count += 1;
    acc.revenue += importe(r);
    servicios.set(r.serviceName, acc);
  });

  // Métodos de pago (solo los que se usaron)
  const byMethod = payMethods
    .map((method) => {
      const list = activas.filter((r) => (r.payMethod ?? 'card') === method);
      return { method, count: list.length, revenue: list.reduce((n, r) => n + importe(r), 0) };
    })
    .filter((m) => m.count > 0);

  // Horario con más reservas
  const horas = new Map<string, number>();
  activas.forEach((r) => horas.set(r.time, (horas.get(r.time) ?? 0) + 1));
  const peakHour = [...horas.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    from,
    to,
    rows,
    total: rows.length,
    byStatus,
    revenue,
    collected: revenue - pending,
    pending,
    lost: rows.filter((r) => r.status === 'cancelada').reduce((n, r) => n + importe(r), 0),
    ticket: activas.length ? Math.round(revenue / activas.length) : 0,
    clients: new Set(rows.map((r) => r.customerName)).size,
    cancelRate: rows.length ? Math.round((byStatus.cancelada / rows.length) * 100) : 0,
    buckets,
    bucketUnit: unit,
    byService: [...servicios.values()].sort((a, b) => b.revenue - a.revenue),
    byMethod,
    peakHour,
  };
}
