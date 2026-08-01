// Tipos de reserva que puede ofrecer un negocio.
// El administrador elige uno en Configuración → "Tipo de reservas" y el
// flujo del cliente (fecha / horario / confirmar) se adapta a esa elección.

import type { BusinessType } from './businesses';

export type BookingMode = 'hora' | 'dia' | 'cupo' | 'mesa' | 'evento';

export interface BookingModeInfo {
  mode: BookingMode;
  label: string;
  icon: string;
  hint: string;
}

export const bookingModes: BookingModeInfo[] = [
  {
    mode: 'hora',
    label: 'Por hora (cita)',
    icon: '🕐',
    hint: 'El cliente elige un día y una hora exacta. Ideal para barberías, clínicas y estéticas.',
  },
  {
    mode: 'dia',
    label: 'Por día (check-in / check-out)',
    icon: '🛏️',
    hint: 'El cliente elige fecha de entrada y de salida; se cobra por noche. Ideal para hoteles.',
  },
  {
    mode: 'cupo',
    label: 'Por cupo (lugares por horario)',
    icon: '👥',
    hint: 'Varias personas comparten el mismo horario hasta llenar el aforo. Ideal para clases y talleres.',
  },
  {
    mode: 'mesa',
    label: 'Por mesa (nº de personas)',
    icon: '🍽️',
    hint: 'El cliente indica cuántas personas y el sistema le asigna una mesa libre. Ideal para restaurantes.',
  },
  {
    mode: 'evento',
    label: 'Por evento (salón completo)',
    icon: '🎉',
    hint: 'El cliente aparta el salón completo en un día y turno, e indica cuántos invitados. Ideal para salones de eventos.',
  },
];

export const bookingModeInfo = (mode: BookingMode): BookingModeInfo =>
  bookingModes.find((m) => m.mode === mode) ?? bookingModes[0];

export const bookingModeLabel = (mode: BookingMode): string => bookingModeInfo(mode).label;

// Tipo de reserva sugerido según el giro del negocio (se puede cambiar).
export function defaultBookingMode(type?: BusinessType): BookingMode {
  switch (type) {
    case 'hospedaje': return 'dia';
    case 'alimentos': return 'mesa';
    case 'ejercicio': return 'cupo';
    case 'eventos': return 'evento';
    default: return 'hora';
  }
}

/* ---- Precio ----
   Por hora se cobra el servicio; por día, cada noche; por cupo, mesa o
   evento, cada persona (en los eventos, cada invitado). */
export function bookingTotal(
  mode: BookingMode,
  price: number,
  opts: { nights?: number; people?: number } = {},
): number {
  if (mode === 'dia') return price * Math.max(1, opts.nights ?? 1);
  if (mode === 'cupo' || mode === 'mesa' || mode === 'evento') {
    return price * Math.max(1, opts.people ?? 1);
  }
  return price;
}

// Cómo se explica el precio unitario al cliente.
export function priceNote(mode: BookingMode): string {
  switch (mode) {
    case 'dia': return 'por noche';
    case 'cupo': return 'por persona';
    case 'mesa': return 'consumo estimado por persona';
    case 'evento': return 'por invitado';
    default: return 'por servicio';
  }
}

/* ---- Pasos del flujo de reserva ----
   Las reservas por día no eligen horario, así que muestran un paso menos. */
export type BookingStage = 'servicio' | 'fecha' | 'horario' | 'confirmar' | 'pago';

export function bookingSteps(mode: BookingMode): string[] {
  return mode === 'dia'
    ? ['Servicio', 'Fechas', 'Confirmar', 'Pago']
    : ['Servicio', 'Fecha', 'Horario', 'Confirmar', 'Pago'];
}

export function bookingStep(mode: BookingMode, stage: BookingStage): number {
  const map = mode === 'dia'
    ? { servicio: 1, fecha: 2, horario: 2, confirmar: 3, pago: 4 }
    : { servicio: 1, fecha: 2, horario: 3, confirmar: 4, pago: 5 };
  return map[stage];
}
