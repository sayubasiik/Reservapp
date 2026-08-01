// Datos mock de "Mis Reservas".
// En producción vendrían de GET /api/reservations/me

export type ReservationStatus = 'confirmada' | 'pendiente' | 'cancelada';

export interface Reservation {
  id: string;
  serviceName: string;
  image: string;
  date: string;      // texto ya formateado (14 Julio 2026)
  time: string;      // 10:00 AM
  address: string;
  status: ReservationStatus;
  group: 'proximas' | 'anteriores' | 'canceladas';
}

export const myReservations: Reservation[] = [
  {
    id: 'r-barberia',
    serviceName: 'Barbería Elite',
    image: '/images/barberia-elite.svg',
    date: '14 Julio 2026',
    time: '10:00 AM',
    address: 'Av. Universidad 123',
    status: 'confirmada',
    group: 'proximas',
  },
  {
    id: 'r-spa',
    serviceName: 'Spa Relax',
    image: '/images/spa-relax.svg',
    date: '22 Julio 2026',
    time: '4:00 PM',
    address: 'Paseo de la Reforma 500',
    status: 'confirmada',
    group: 'proximas',
  },
  {
    id: 'r-dental',
    serviceName: 'Clínica Dental',
    image: '/images/clinica-dental.svg',
    date: '28 Julio 2026',
    time: '2:00 PM',
    address: 'Insurgentes Sur 300',
    status: 'pendiente',
    group: 'proximas',
  },
  {
    id: 'r-yoga',
    serviceName: 'Yoga Studio',
    image: '/images/yoga-studio.svg',
    date: '1 Agosto 2026',
    time: '8:00 AM',
    address: 'Polanco, CDMX',
    status: 'confirmada',
    group: 'proximas',
  },
];
