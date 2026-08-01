// Datos mock del Panel Administrador (pantallas 16-20).
// En producción vendrían de la API del negocio.

import type { CategoryColor } from '../types';

/* ---- Calendario (16) ---- */
export type EventStatus = 'confirmada' | 'pendiente' | 'cancelada';

export interface CalendarEvent {
  day: number;      // 0=Lun ... 6=Dom
  hour: number;     // 9..20
  client: string;
  service: string;
  status: EventStatus;
}

export const weekDays = [
  { name: 'Lun', date: 20 },
  { name: 'Mar', date: 21 },
  { name: 'Mié', date: 22 },
  { name: 'Jue', date: 23 },
  { name: 'Vie', date: 24 },
  { name: 'Sáb', date: 25 },
  { name: 'Dom', date: 26 },
];

export const calendarHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const calendarEvents: CalendarEvent[] = [
  { day: 1, hour: 9,  client: 'Ana García',     service: 'Yoga Studio',    status: 'confirmada' },
  { day: 0, hour: 10, client: 'Juan Pérez',     service: 'Barbería Elite', status: 'confirmada' },
  { day: 4, hour: 10, client: 'Diana Castro',   service: 'Clínica Dental', status: 'confirmada' },
  { day: 0, hour: 11, client: 'María López',    service: 'Spa Relax',      status: 'confirmada' },
  { day: 5, hour: 11, client: 'Sofía Ramos',    service: 'Barbería Elite', status: 'confirmada' },
  { day: 3, hour: 12, client: 'Roberto Silva',  service: 'Barbería Elite', status: 'pendiente'  },
  { day: 0, hour: 13, client: 'Carlos Ruiz',    service: 'Clínica Dental', status: 'pendiente'  },
  { day: 4, hour: 14, client: 'Mario Ibarra',   service: 'Yoga Studio',    status: 'cancelada'  },
  { day: 1, hour: 15, client: 'Luis Torres',    service: 'Barbería Elite', status: 'confirmada' },
  { day: 2, hour: 16, client: 'Fernanda Gómez', service: 'Spa Relax',      status: 'confirmada' },
  { day: 0, hour: 14, client: 'Pedro Ramírez',  service: 'Restaurante La Terraza', status: 'confirmada' },
  { day: 2, hour: 15, client: 'Lucía Méndez',   service: 'Restaurante La Terraza', status: 'pendiente'  },
  { day: 5, hour: 18, client: 'Andrés Soto',    service: 'Restaurante La Terraza', status: 'confirmada' },
];

export const serviceLegend = [
  { name: 'Barbería Elite',         color: '#1E3A8A' },
  { name: 'Spa Relax',              color: '#3B82F6' },
  { name: 'Clínica Dental',         color: '#16A34A' },
  { name: 'Yoga Studio',            color: '#F59E0B' },
  { name: 'Restaurante La Terraza', color: '#7C3AED' },
];

/* ---- Clientes (17) ---- */
export interface Client {
  initials: string;
  name: string;
  email: string;
  phone: string;
  reservations: number;
  lastVisit: string;
  active: boolean;
}

export const clientStats = [
  { label: 'Total clientes',     value: '284', delta: '+8% este mes' },
  { label: 'Nuevos este mes',    value: '32',  delta: '+14%' },
  { label: 'Clientes recurrentes', value: '176', delta: '+5%' },
];

export const clients: Client[] = [
  { initials: 'JP', name: 'Juan Pérez',     email: 'juan.perez@correo.com',     phone: '(55) 1234 5678', reservations: 12, lastVisit: '14 Jul 2026', active: true },
  { initials: 'ML', name: 'María López',    email: 'maria.lopez@correo.com',    phone: '(55) 2345 6789', reservations: 8,  lastVisit: '10 Jul 2026', active: true },
  { initials: 'CR', name: 'Carlos Ruiz',    email: 'carlos.ruiz@correo.com',    phone: '(55) 3456 7890', reservations: 5,  lastVisit: '28 Jun 2026', active: true },
  { initials: 'AG', name: 'Ana García',     email: 'ana.garcia@correo.com',     phone: '(55) 4567 8901', reservations: 3,  lastVisit: '1 Ago 2026',  active: true },
  { initials: 'LT', name: 'Luis Torres',    email: 'luis.torres@correo.com',    phone: '(55) 5678 9012', reservations: 1,  lastVisit: '2 Jul 2026',  active: false },
  { initials: 'FG', name: 'Fernanda Gómez', email: 'fernanda.gomez@correo.com', phone: '(55) 6789 0123', reservations: 9,  lastVisit: '22 Jul 2026', active: true },
  { initials: 'RS', name: 'Roberto Silva',  email: 'roberto.silva@correo.com',  phone: '(55) 7890 1234', reservations: 2,  lastVisit: '15 Jun 2026', active: false },
  { initials: 'DC', name: 'Diana Castro',   email: 'diana.castro@correo.com',   phone: '(55) 8901 2345', reservations: 6,  lastVisit: '24 Jul 2026', active: true },
];

/* ---- Galería (18) ---- */
export interface GalleryItem {
  title: string;
  business: string;
  color: CategoryColor;
}

export const galleryFilters = ['Todas', 'Barbería Elite', 'Spa Relax', 'Clínica Dental', 'Yoga Studio'];

export const galleryItems: GalleryItem[] = [
  { title: 'Interior del salón',   business: 'Barbería Elite', color: 'blue' },
  { title: 'Estación de corte',    business: 'Barbería Elite', color: 'blue' },
  { title: 'Sala de masajes',      business: 'Spa Relax',      color: 'pink' },
  { title: 'Recepción',            business: 'Spa Relax',      color: 'pink' },
  { title: 'Consultorio 1',        business: 'Clínica Dental', color: 'amber' },
  { title: 'Equipo dental',        business: 'Clínica Dental', color: 'amber' },
  { title: 'Clase grupal',         business: 'Yoga Studio',    color: 'green' },
  { title: 'Tapetes y accesorios', business: 'Yoga Studio',    color: 'green' },
  { title: 'Terraza exterior',     business: 'Restaurante La Terraza', color: 'pink' },
  { title: 'Salón principal',      business: 'Restaurante La Terraza', color: 'amber' },
];

/* ---- Mensajes (19) ---- */
export interface Conversation {
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
}

export interface ChatMessage {
  text: string;
  time: string;
  mine: boolean;    // true = enviado por el negocio
}

export const conversations: Conversation[] = [
  { initials: 'JP', name: 'Juan Pérez',     preview: '¿Puedo cambiar mi cita a las 11?', time: '10:32', unread: 1 },
  { initials: 'ML', name: 'María López',    preview: 'Gracias, nos vemos mañana',        time: '09:15', unread: 0 },
  { initials: 'CR', name: 'Carlos Ruiz',    preview: '¿Tienen disponibilidad el viernes?', time: 'Ayer', unread: 2 },
  { initials: 'AG', name: 'Ana García',     preview: 'Perfecto, ahí estaré',             time: 'Ayer',  unread: 0 },
  { initials: 'LT', name: 'Luis Torres',    preview: '¿Cuánto cuesta el corte + barba?', time: 'Lun',   unread: 0 },
  { initials: 'FG', name: 'Fernanda Gómez', preview: 'Confirmado, muchas gracias',       time: 'Lun',   unread: 0 },
];

export const activeChat = {
  name: 'Juan Pérez',
  context: 'Barbería Elite · Reserva 14 Julio, 10:00 AM',
  messages: [
    { text: 'Hola, buenos días',                              time: '10:28', mine: false },
    { text: '¿Puedo cambiar mi cita a las 11:00 AM?',         time: '10:29', mine: false },
    { text: '¡Hola Juan! Claro, déjame revisar la disponibilidad.', time: '10:31', mine: true },
    { text: 'Listo, tu cita quedó reagendada para las 11:00 AM ✓', time: '10:32', mine: true },
    { text: '¡Perfecto, muchas gracias!',                     time: '10:32', mine: false },
  ] as ChatMessage[],
};

/* ---- Configuración (20) ---- */
export const settingsTabs = [
  'Perfil del negocio', 'Tipo de reservas', 'Horarios de atención', 'Notificaciones', 'Métodos de pago', 'Seguridad',
];

export const businessHours = [
  { day: 'Lunes',     open: true,  hours: '9:00 – 20:00' },
  { day: 'Martes',    open: true,  hours: '9:00 – 20:00' },
  { day: 'Miércoles', open: true,  hours: '9:00 – 20:00' },
  { day: 'Jueves',    open: true,  hours: '9:00 – 20:00' },
  { day: 'Viernes',   open: true,  hours: '9:00 – 20:00' },
  { day: 'Sábado',    open: true,  hours: '10:00 – 16:00' },
  { day: 'Domingo',   open: false, hours: 'Cerrado' },
];
