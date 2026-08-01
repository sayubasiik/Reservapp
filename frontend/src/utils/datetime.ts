// Utilidades de fecha/hora compartidas por el flujo de reservas.

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// "2026-07-21" -> "21 Julio 2026"
export function formatDateLabel(dateISO: string): string {
  if (!dateISO) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// yyyy-mm-dd de hoy en zona local.
export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// Convierte "10:00 AM" a minutos desde medianoche.
export function slotToMinutes(slot: string): number {
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const pm = /pm/i.test(m[3]);
  if (h === 12) h = 0;
  if (pm) h += 12;
  return h * 60 + min;
}

/* ---- Reservas por día (check-in / check-out) ---- */

// Suma días a una fecha ISO ("2026-07-21" + 2 -> "2026-07-23").
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const nextDayISO = (dateISO: string) => addDaysISO(dateISO, 1);

// Noches entre dos fechas ISO (check-in → check-out).
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const ms = new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

// ¿Se traslapan dos estancias? La salida no cuenta como noche ocupada,
// así que un check-out el día 15 permite un check-in ese mismo 15.
export function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}

// ¿El horario ya pasó para la fecha dada? (solo importa si la fecha es hoy).
export function slotHasPassed(dateISO: string, slot: string): boolean {
  if (dateISO !== todayISO()) return false;
  const now = new Date();
  return slotToMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
}
