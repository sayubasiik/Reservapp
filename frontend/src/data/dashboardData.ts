// Datos mock del Panel Administrador (Dashboard).
// En producción vendrían de GET /api/businesses/:id/stats

export interface StatCard {
  label: string;
  value: string;
  delta: string;   // variación (+12%)
}

export interface HourBar {
  hour: string;    // etiqueta del eje (9, 10, ...)
  value: number;   // 0-100, altura relativa de la barra
}

export interface UpcomingItem {
  time: string;
  name: string;
  initials: string;
}

export const stats: StatCard[] = [
  { label: 'Reservas hoy', value: '35',     delta: '+12%' },
  { label: 'Ocupación',    value: '92%',    delta: '+5%'  },
  { label: 'Ingresos',     value: '$8,540', delta: '+18%' },
  { label: 'Clientes',     value: '284',    delta: '+8%'  },
];

export const hourlyBookings: HourBar[] = [
  { hour: '9',  value: 30 },
  { hour: '10', value: 85 },
  { hour: '11', value: 70 },
  { hour: '12', value: 55 },
  { hour: '13', value: 95 },
  { hour: '14', value: 65 },
  { hour: '15', value: 80 },
  { hour: '16', value: 45 },
  { hour: '17', value: 75 },
  { hour: '18', value: 60 },
];

export const upcoming: UpcomingItem[] = [
  { time: '10:00', name: 'Juan Pérez',  initials: 'JP' },
  { time: '11:00', name: 'María López',  initials: 'ML' },
  { time: '12:00', name: 'Carlos Ruiz',  initials: 'CR' },
  { time: '13:00', name: 'Ana García',   initials: 'AG' },
  { time: '14:00', name: 'Luis Torres',  initials: 'LT' },
];
