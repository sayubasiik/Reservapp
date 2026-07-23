import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_CAPACITY, TIME_SLOTS } from '../data/slots';
import { businessById, businessIdForService } from '../data/businesses';
import type { BusinessType } from '../data/businesses';
import { defaultBookingMode } from '../data/bookingModes';
import type { BookingMode } from '../data/bookingModes';
import type { PayMethod, PayStatus } from '../data/payments';
import { seedHistory } from '../data/historySeed';
import { nightsBetween, rangesOverlap, nextDayISO } from '../utils/datetime';

/* =========================================================
   Store global de la app (persistido en localStorage).
   Centraliza lo que antes eran datos estáticos para que la
   maqueta funcione de verdad: reservas, favoritos, cupos por
   horario y mensajes.
   En producción cada parte hablaría con la API de FastAPI.
   ========================================================= */

export type ResStatus = 'pendiente' | 'confirmada' | 'cancelada';

export interface Reservation {
  id: string;
  serviceId: string;
  serviceName: string;
  image: string;
  address: string;
  date: string;        // ISO yyyy-mm-dd (check-in si la reserva es por día)
  dateLabel: string;   // "14 Julio 2026" (para mostrar)
  time: string;        // "10:00 AM" (hora de check-in si la reserva es por día)
  customerName: string;
  status: ResStatus;
  createdAt: number;
  // ---- Campos según el tipo de reserva del negocio ----
  mode?: BookingMode;      // 'hora' | 'dia' | 'cupo' | 'mesa'
  people?: number;         // 'cupo' y 'mesa': nº de personas
  checkOut?: string;       // 'dia': ISO de salida
  checkOutLabel?: string;  // 'dia': "16 Julio 2026"
  checkOutTime?: string;   // 'dia': hora de salida ("12:00 PM")
  nights?: number;         // 'dia': noches reservadas
  tableId?: string;        // 'mesa': mesa asignada
  tableLabel?: string;     // 'mesa': "Mesa 3"
  total?: number;          // importe de la reserva
  // ---- Pago ----
  payMethod?: PayMethod;   // 'card' | 'paypal' | 'local'
  payStatus?: PayStatus;   // 'pagado' | 'pendiente' (pendiente = paga en el lugar)
}

export interface ChatMessage {
  text: string;
  time: string;
  mine: boolean;       // true = enviado por el negocio (admin)
}

export interface Conversation {
  id: string;
  initials: string;
  name: string;
  context: string;
  messages: ChatMessage[];
  unread: number;
  phone?: string;      // teléfono del cliente (para abrir WhatsApp / futura API)
}

// Mesa de un restaurante (administrada por el dueño del negocio).
export interface Table {
  id: string;
  seats: number;   // para cuántas personas
}

// Imagen de la galería del negocio (foto real subida por el admin).
export interface GalleryImage {
  id: string;
  title: string;
  url: string;     // dataURL de la imagen subida
}

// Cliente agregado manualmente por el admin (además de los que reservan).
export interface ManualClient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Un día del horario de atención (editable por el admin).
export interface DayHours {
  day: string;
  open: boolean;
  from: string;    // "09:00"
  to: string;      // "20:00"
}

// Perfil editable del negocio (logo, categoría, contacto, horarios).
export interface BusinessProfile {
  logo?: string;        // dataURL del logo subido
  name?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  hours?: DayHours[];
  instagram?: string;  // usuario o URL de Instagram
  facebook?: string;   // página o URL de Facebook
  whatsapp?: string;   // número de WhatsApp del negocio
}

/* ---- Tipo de reservas del negocio (lo elige el admin en Configuración) ---- */
export interface BookingConfig {
  mode: BookingMode;
  slotCapacity: Record<string, number>; // 'hora'/'cupo': espacios por horario
  checkInTime: string;                  // 'dia': hora de entrada
  checkOutTime: string;                 // 'dia': hora de salida
  units: number;                        // 'dia': unidades (habitaciones) por tipo
  minNights: number;                    // 'dia': mínimo de noches
  maxPeople: number;                    // 'cupo'/'mesa': máximo de personas por reserva
}

export const BOOKING_DEFAULTS = {
  checkInTime: '3:00 PM',
  checkOutTime: '12:00 PM',
  units: 2,
  minNights: 1,
  maxPeople: 10,
  maxGuests: 250,   // 'evento': invitados por evento
};

interface StoreState {
  favorites: string[];                    // ids de servicios
  capacity: Record<string, number>;       // horario -> nº de espacios (valor por defecto)
  bookingConfigs: Record<string, Partial<BookingConfig>>; // businessId -> tipo de reserva
  reservations: Reservation[];
  conversations: Conversation[];
  tables: Record<string, Table[]>;        // businessId -> mesas
  gallery: Record<string, GalleryImage[]>;// businessId -> imágenes
  manualClients: Record<string, ManualClient[]>; // businessId -> clientes agregados
  customCategories: string[];             // categorías creadas por los admins
  profiles: Record<string, BusinessProfile>; // businessId -> perfil del negocio
}

interface StoreValue extends StoreState {
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  // Tipo de reservas del negocio
  getBookingConfig: (businessId?: string, type?: BusinessType) => BookingConfig;
  getServiceBooking: (serviceId: string) => BookingConfig;
  setBookingConfig: (businessId: string, patch: Partial<BookingConfig>) => void;
  setSlotCapacity: (businessId: string, time: string, n: number) => void;
  // Disponibilidad según el tipo de reserva
  getAvailable: (serviceId: string, dateISO: string, time: string) => number;
  getRoomsAvailable: (serviceId: string, checkIn: string, checkOut: string) => number;
  getFreeTables: (serviceId: string, dateISO: string, time: string, people: number) => Table[];
  book: (r: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => boolean;
  reschedule: (
    id: string,
    dateISO: string,
    dateLabel: string,
    time: string,
    extra?: { checkOut?: string; checkOutLabel?: string; people?: number },
  ) => boolean;
  acceptReservation: (id: string) => void;
  cancelReservation: (id: string) => void;
  sendMessage: (convId: string, text: string) => void;
  readConversation: (convId: string) => void;
  getTables: (businessId?: string) => Table[];
  addTable: (businessId: string, seats: number) => void;
  removeTable: (businessId: string, tableId: string) => void;
  setTableSeats: (businessId: string, tableId: string, seats: number) => void;
  // Galería del negocio
  getGallery: (businessId?: string) => GalleryImage[];
  addGalleryImage: (businessId: string, img: Omit<GalleryImage, 'id'>) => void;
  removeGalleryImage: (businessId: string, imageId: string) => void;
  renameGalleryImage: (businessId: string, imageId: string, title: string) => void;
  // Clientes agregados manualmente
  getManualClients: (businessId?: string) => ManualClient[];
  addManualClient: (businessId: string, client: Omit<ManualClient, 'id'>) => void;
  // Categorías y perfil de negocio
  addCustomCategory: (name: string) => void;
  getProfile: (businessId?: string) => BusinessProfile;
  setProfile: (businessId: string, patch: Partial<BusinessProfile>) => void;
  // Nueva conversación (mensajes)
  addConversation: (conv: Omit<Conversation, 'id'>) => string;
}

/* ---- Datos iniciales (semilla) ---- */
const seedReservations: Reservation[] = [
  { id: 's1', serviceId: 'barberia-elite', serviceName: 'Barbería Elite', image: '/images/barberia-elite.svg', address: 'Av. Universidad 123',      date: '2026-07-14', dateLabel: '14 Julio 2026', time: '10:00 AM', customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 1, total: 250, payMethod: 'card',   payStatus: 'pagado' },
  { id: 's2', serviceId: 'spa-relax',      serviceName: 'Spa Relax',      image: '/images/spa-relax.svg',      address: 'Paseo de la Reforma 500', date: '2026-07-22', dateLabel: '22 Julio 2026', time: '4:00 PM',  customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 2, total: 600, payMethod: 'paypal', payStatus: 'pagado' },
  { id: 's3', serviceId: 'clinica-dental', serviceName: 'Clínica Dental', image: '/images/clinica-dental.svg', address: 'Insurgentes Sur 300',     date: '2026-07-28', dateLabel: '28 Julio 2026', time: '2:00 PM',  customerName: 'Olaf Andrade', status: 'pendiente',  createdAt: 3, total: 800, payMethod: 'local',  payStatus: 'pendiente' },
  { id: 's4', serviceId: 'yoga-studio',    serviceName: 'Yoga Studio',    image: '/images/yoga-studio.svg',    address: 'Polanco, CDMX',          date: '2026-08-01', dateLabel: '1 Agosto 2026', time: '9:00 AM',  customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 4, mode: 'cupo', people: 2, total: 800, payMethod: 'card', payStatus: 'pagado' },
  // Ejemplos de los otros tipos de reserva.
  { id: 's5', serviceId: 'hotel-brisa-doble', serviceName: 'Hotel Brisa · Habitación Doble', image: '/images/spa-relax.svg', address: 'Av. del Mar 100, Zona Hotelera', date: '2026-08-10', dateLabel: '10 Agosto 2026', time: '3:00 PM', customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 5, mode: 'dia', checkOut: '2026-08-13', checkOutLabel: '13 Agosto 2026', checkOutTime: '12:00 PM', nights: 3, people: 2, total: 4200, payMethod: 'card', payStatus: 'pagado' },
  { id: 's7', serviceId: 'salon-jardin-cristal', serviceName: 'Salón Jardín Real · Salón Cristal', image: '/images/salon-jardin.svg', address: 'Av. de los Fresnos 450, Col. Las Flores', date: '2026-09-05', dateLabel: '5 Septiembre 2026', time: '6:00 PM', customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 7, mode: 'evento', people: 120, total: 45600, payMethod: 'local', payStatus: 'pendiente' },
  { id: 's6', serviceId: 'terraza', serviceName: 'Restaurante La Terraza', image: '/images/spa-relax.svg', address: 'Av. Reforma 222, Col. Juárez', date: '2026-07-25', dateLabel: '25 Julio 2026', time: '8:00 PM', customerName: 'Olaf Andrade', status: 'pendiente', createdAt: 6, mode: 'mesa', people: 4, tableId: 't3', tableLabel: 'Mesa 3', total: 1200, payMethod: 'local', payStatus: 'pendiente' },
];

const seedConversations: Conversation[] = [
  {
    id: 'c1', initials: 'JP', name: 'Juan Pérez', context: 'Barbería Elite · Reserva 14 Julio, 10:00 AM', unread: 0,
    messages: [
      { text: 'Hola, buenos días', time: '10:28', mine: false },
      { text: '¿Puedo cambiar mi cita a las 11:00 AM?', time: '10:29', mine: false },
      { text: '¡Hola Juan! Claro, déjame revisar la disponibilidad.', time: '10:31', mine: true },
      { text: 'Listo, tu cita quedó reagendada para las 11:00 AM ✓', time: '10:32', mine: true },
      { text: '¡Perfecto, muchas gracias!', time: '10:32', mine: false },
    ],
  },
  { id: 'c2', initials: 'ML', name: 'María López', context: 'Spa Relax · Reserva 22 Julio, 4:00 PM', unread: 0,
    messages: [
      { text: '¿Sigue en pie mi cita de mañana?', time: '09:10', mine: false },
      { text: 'Así es María, te esperamos a las 4:00 PM.', time: '09:14', mine: true },
      { text: 'Gracias, nos vemos mañana', time: '09:15', mine: false },
    ] },
  { id: 'c3', initials: 'CR', name: 'Carlos Ruiz', context: 'Clínica Dental · Consulta general', unread: 2,
    messages: [
      { text: '¿Tienen disponibilidad el viernes?', time: 'Ayer', mine: false },
      { text: '¿En la mañana o en la tarde?', time: 'Ayer', mine: false },
    ] },
  { id: 'c4', initials: 'AG', name: 'Ana García', context: 'Yoga Studio · Clase grupal', unread: 0,
    messages: [
      { text: 'Confirmo mi lugar para la clase.', time: 'Ayer', mine: false },
      { text: '¡Perfecto Ana, ahí te esperamos!', time: 'Ayer', mine: true },
      { text: 'Perfecto, ahí estaré', time: 'Ayer', mine: false },
    ] },
  { id: 'c5', initials: 'LT', name: 'Luis Torres', context: 'Barbería Elite · Corte + barba', unread: 0,
    messages: [ { text: '¿Cuánto cuesta el corte + barba?', time: 'Lun', mine: false } ] },
  { id: 'c6', initials: 'FG', name: 'Fernanda Gómez', context: 'Spa Relax · Masaje', unread: 0,
    messages: [
      { text: '¿Puedo pagar en el lugar?', time: 'Lun', mine: false },
      { text: 'Claro que sí, aceptamos pago en efectivo.', time: 'Lun', mine: true },
      { text: 'Confirmado, muchas gracias', time: 'Lun', mine: false },
    ] },
  { id: 'c7', initials: 'PR', name: 'Pedro Ramírez', context: 'Restaurante La Terraza · Mesa para 4', unread: 1,
    messages: [ { text: '¿Tienen mesa para 4 el sábado por la noche?', time: 'Hoy', mine: false } ] },
];

const initialState: StoreState = {
  favorites: ['spa-relax', 'yoga-studio', 'clinica-dental'],
  capacity: { ...DEFAULT_CAPACITY },
  // Cada negocio arranca con el tipo de reserva típico de su giro; el admin
  // puede cambiarlo desde Configuración → Tipo de reservas.
  bookingConfigs: {
    // El estudio de yoga trabaja por cupo: 12 lugares en cada clase.
    'yoga-studio': {
      mode: 'cupo',
      slotCapacity: Object.fromEntries(TIME_SLOTS.map((s) => [s, 12])),
      maxPeople: 6,
    },
    'hotel-brisa': { mode: 'dia', units: 3 },
    terraza: { mode: 'mesa' },
    // El salón de eventos aparta el lugar completo: un solo evento por turno,
    // con un máximo de invitados.
    'salon-jardin': { mode: 'evento', maxPeople: 250 },
  },
  // A las reservas de ejemplo se les suma el historial de los últimos meses,
  // para que el panel y el reporte del negocio no arranquen vacíos.
  reservations: [...seedReservations, ...seedHistory()],
  conversations: seedConversations,
  tables: {
    // El restaurante arranca con algunas mesas de ejemplo.
    terraza: [
      { id: 't1', seats: 2 },
      { id: 't2', seats: 2 },
      { id: 't3', seats: 4 },
      { id: 't4', seats: 4 },
      { id: 't5', seats: 6 },
    ],
  },
  gallery: {},
  manualClients: {},
  customCategories: [],
  profiles: {},
};

const STORAGE_KEY = 'reservvap_store';

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = { ...initialState, ...(JSON.parse(raw) as StoreState) };
        // Si el navegador guarda una versión anterior de la maqueta, le
        // agregamos el historial de ejemplo para que el reporte no salga vacío.
        if (!saved.reservations.some((r) => r.id.startsWith('h-'))) {
          saved.reservations = [...saved.reservations, ...seedHistory()];
        }
        return saved;
      }
    } catch { /* ignora json inválido */ }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggleFavorite = (id: string) =>
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((f) => f !== id)
        : [...s.favorites, id],
    }));

  const isFavorite = (id: string) => state.favorites.includes(id);

  /* ---- Tipo de reservas del negocio ---- */
  const getBookingConfig: StoreValue['getBookingConfig'] = (businessId, type) => {
    const saved = (businessId ? state.bookingConfigs[businessId] : undefined) ?? {};
    const mode = saved.mode ?? defaultBookingMode(type ?? businessById(businessId)?.type);
    return {
      mode,
      slotCapacity: { ...state.capacity, ...(saved.slotCapacity ?? {}) },
      checkInTime: saved.checkInTime ?? BOOKING_DEFAULTS.checkInTime,
      checkOutTime: saved.checkOutTime ?? BOOKING_DEFAULTS.checkOutTime,
      units: saved.units ?? BOOKING_DEFAULTS.units,
      minNights: saved.minNights ?? BOOKING_DEFAULTS.minNights,
      // Un evento lleva muchos más invitados que una mesa o una clase.
      maxPeople: saved.maxPeople
        ?? (mode === 'evento' ? BOOKING_DEFAULTS.maxGuests : BOOKING_DEFAULTS.maxPeople),
    };
  };

  // Configuración que aplica a un servicio (usa el negocio dueño del servicio).
  const getServiceBooking = (serviceId: string) => getBookingConfig(businessIdForService(serviceId));

  const setBookingConfig: StoreValue['setBookingConfig'] = (businessId, patch) =>
    setState((s) => ({
      ...s,
      bookingConfigs: {
        ...s.bookingConfigs,
        [businessId]: { ...(s.bookingConfigs[businessId] ?? {}), ...patch },
      },
    }));

  const setSlotCapacity: StoreValue['setSlotCapacity'] = (businessId, time, n) =>
    setState((s) => {
      const cfg = s.bookingConfigs[businessId] ?? {};
      const slots = { ...s.capacity, ...(cfg.slotCapacity ?? {}), [time]: Math.max(0, n) };
      return {
        ...s,
        bookingConfigs: { ...s.bookingConfigs, [businessId]: { ...cfg, slotCapacity: slots } },
      };
    });

  /* ---- Disponibilidad ----
     Cada tipo de reserva se llena de forma distinta:
     · hora  → 1 reserva ocupa 1 espacio del horario
     · cupo  → cada reserva ocupa tantos lugares como personas
     · dia   → la habitación se ocupa mientras las estancias se traslapen
     · mesa  → se ocupa una mesa concreta en ese horario
     · evento→ una reserva aparta el salón completo en ese turno */
  const activeFor = (serviceId: string, excludeId?: string) =>
    state.reservations.filter(
      (r) => r.serviceId === serviceId && r.status !== 'cancelada' && r.id !== excludeId,
    );

  const availableAt = (serviceId: string, dateISO: string, time: string, excludeId?: string) => {
    const cfg = getServiceBooking(serviceId);
    // En los eventos el salón se aparta completo: un solo evento por turno.
    const cap = cfg.mode === 'evento' ? 1 : (cfg.slotCapacity[time] ?? 1);
    const taken = activeFor(serviceId, excludeId)
      .filter((r) => r.date === dateISO && r.time === time)
      .reduce((n, r) => n + (cfg.mode === 'cupo' ? Math.max(1, r.people ?? 1) : 1), 0);
    return Math.max(0, cap - taken);
  };

  const getAvailable: StoreValue['getAvailable'] = (serviceId, dateISO, time) =>
    availableAt(serviceId, dateISO, time);

  const roomsAvailable = (serviceId: string, checkIn: string, checkOut: string, excludeId?: string) => {
    const cfg = getServiceBooking(serviceId);
    const taken = activeFor(serviceId, excludeId).filter((r) =>
      rangesOverlap(checkIn, checkOut, r.date, r.checkOut ?? nextDayISO(r.date)),
    ).length;
    return Math.max(0, cfg.units - taken);
  };

  const getRoomsAvailable: StoreValue['getRoomsAvailable'] = (serviceId, checkIn, checkOut) =>
    roomsAvailable(serviceId, checkIn, checkOut);

  const freeTables = (serviceId: string, dateISO: string, time: string, people: number, excludeId?: string) => {
    const bizId = businessIdForService(serviceId);
    const busy = new Set(
      activeFor(serviceId, excludeId)
        .filter((r) => r.date === dateISO && r.time === time && r.tableId)
        .map((r) => r.tableId),
    );
    return (state.tables[bizId] ?? [])
      .filter((t) => t.seats >= people && !busy.has(t.id))
      .sort((a, b) => a.seats - b.seats); // primero la mesa más justa
  };

  const getFreeTables: StoreValue['getFreeTables'] = (serviceId, dateISO, time, people) =>
    freeTables(serviceId, dateISO, time, people);

  // Etiqueta legible de una mesa ("Mesa 3"), según su posición en el negocio.
  const tableLabelOf = (bizId: string, tableId: string) => {
    const i = (state.tables[bizId] ?? []).findIndex((t) => t.id === tableId);
    return `Mesa ${i + 1}`;
  };

  const book: StoreValue['book'] = (r) => {
    const mode = r.mode ?? getServiceBooking(r.serviceId).mode;
    let assigned: Partial<Reservation> = {};

    if (mode === 'dia') {
      const checkOut = r.checkOut ?? nextDayISO(r.date);
      if (roomsAvailable(r.serviceId, r.date, checkOut) <= 0) return false;
    } else if (mode === 'mesa') {
      const free = freeTables(r.serviceId, r.date, r.time, Math.max(1, r.people ?? 1));
      if (free.length === 0) return false;
      const bizId = businessIdForService(r.serviceId);
      assigned = { tableId: free[0].id, tableLabel: tableLabelOf(bizId, free[0].id) };
    } else if (availableAt(r.serviceId, r.date, r.time) < (mode === 'cupo' ? Math.max(1, r.people ?? 1) : 1)) {
      return false;
    }

    const reservation: Reservation = {
      ...r,
      ...assigned,
      mode,
      id: `r-${Date.now()}`,
      status: 'pendiente',
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, reservations: [reservation, ...s.reservations] }));
    return true;
  };

  // Reagenda una reserva (verifica la disponibilidad según su tipo).
  const reschedule: StoreValue['reschedule'] = (id, dateISO, dateLabel, time, extra) => {
    const r = state.reservations.find((x) => x.id === id);
    if (!r) return false;
    const mode = r.mode ?? getServiceBooking(r.serviceId).mode;
    const people = extra?.people ?? r.people;
    let patch: Partial<Reservation> = { date: dateISO, dateLabel, time, status: 'pendiente' };

    if (mode === 'dia') {
      const checkOut = extra?.checkOut ?? r.checkOut ?? nextDayISO(dateISO);
      if (roomsAvailable(r.serviceId, dateISO, checkOut, id) <= 0) return false;
      patch = {
        ...patch,
        checkOut,
        checkOutLabel: extra?.checkOutLabel ?? r.checkOutLabel,
        nights: nightsBetween(dateISO, checkOut),
        people,
      };
    } else if (mode === 'mesa') {
      const free = freeTables(r.serviceId, dateISO, time, Math.max(1, people ?? 1), id);
      if (free.length === 0) return false;
      const bizId = businessIdForService(r.serviceId);
      patch = { ...patch, people, tableId: free[0].id, tableLabel: tableLabelOf(bizId, free[0].id) };
    } else {
      const need = mode === 'cupo' ? Math.max(1, people ?? 1) : 1;
      if (availableAt(r.serviceId, dateISO, time, id) < need) return false;
      patch = { ...patch, people };
    }

    setState((s) => ({
      ...s,
      reservations: s.reservations.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    return true;
  };

  const acceptReservation = (id: string) =>
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'confirmada' } : r)),
    }));

  const cancelReservation = (id: string) =>
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'cancelada' } : r)),
    }));

  const sendMessage = (convId: string, text: string) => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, { text, time: now, mine: true }] } : c,
      ),
    }));
  };

  const readConversation = (convId: string) =>
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)),
    }));

  const getTables = (businessId?: string) => (businessId ? state.tables[businessId] ?? [] : []);

  const addTable = (businessId: string, seats: number) =>
    setState((s) => ({
      ...s,
      tables: {
        ...s.tables,
        [businessId]: [...(s.tables[businessId] ?? []), { id: `t-${Date.now()}`, seats: Math.max(1, seats) }],
      },
    }));

  const removeTable = (businessId: string, tableId: string) =>
    setState((s) => ({
      ...s,
      tables: { ...s.tables, [businessId]: (s.tables[businessId] ?? []).filter((t) => t.id !== tableId) },
    }));

  const setTableSeats = (businessId: string, tableId: string, seats: number) =>
    setState((s) => ({
      ...s,
      tables: {
        ...s.tables,
        [businessId]: (s.tables[businessId] ?? []).map((t) =>
          t.id === tableId ? { ...t, seats: Math.max(1, seats) } : t,
        ),
      },
    }));

  /* ---- Galería ---- */
  const getGallery = (businessId?: string) => (businessId ? state.gallery[businessId] ?? [] : []);

  const addGalleryImage = (businessId: string, img: Omit<GalleryImage, 'id'>) =>
    setState((s) => ({
      ...s,
      gallery: {
        ...s.gallery,
        [businessId]: [{ id: `img-${Date.now()}`, ...img }, ...(s.gallery[businessId] ?? [])],
      },
    }));

  const removeGalleryImage = (businessId: string, imageId: string) =>
    setState((s) => ({
      ...s,
      gallery: { ...s.gallery, [businessId]: (s.gallery[businessId] ?? []).filter((g) => g.id !== imageId) },
    }));

  const renameGalleryImage = (businessId: string, imageId: string, title: string) =>
    setState((s) => ({
      ...s,
      gallery: {
        ...s.gallery,
        [businessId]: (s.gallery[businessId] ?? []).map((g) => (g.id === imageId ? { ...g, title } : g)),
      },
    }));

  /* ---- Clientes manuales ---- */
  const getManualClients = (businessId?: string) => (businessId ? state.manualClients[businessId] ?? [] : []);

  const addManualClient = (businessId: string, client: Omit<ManualClient, 'id'>) =>
    setState((s) => ({
      ...s,
      manualClients: {
        ...s.manualClients,
        [businessId]: [{ id: `cli-${Date.now()}`, ...client }, ...(s.manualClients[businessId] ?? [])],
      },
    }));

  /* ---- Categorías y perfil de negocio ---- */
  const addCustomCategory = (name: string) =>
    setState((s) => (s.customCategories.includes(name)
      ? s
      : { ...s, customCategories: [...s.customCategories, name] }));

  const getProfile = (businessId?: string) => (businessId ? state.profiles[businessId] ?? {} : {});

  const setProfile = (businessId: string, patch: Partial<BusinessProfile>) =>
    setState((s) => ({
      ...s,
      profiles: { ...s.profiles, [businessId]: { ...(s.profiles[businessId] ?? {}), ...patch } },
    }));

  /* ---- Nueva conversación ---- */
  const addConversation: StoreValue['addConversation'] = (conv) => {
    const id = `c-${Date.now()}`;
    setState((s) => ({ ...s, conversations: [{ id, ...conv }, ...s.conversations] }));
    return id;
  };

  return (
    <StoreContext.Provider
      value={{
        ...state,
        toggleFavorite,
        isFavorite,
        getBookingConfig,
        getServiceBooking,
        setBookingConfig,
        setSlotCapacity,
        getAvailable,
        getRoomsAvailable,
        getFreeTables,
        book,
        reschedule,
        acceptReservation,
        cancelReservation,
        sendMessage,
        readConversation,
        getTables,
        addTable,
        removeTable,
        setTableSeats,
        getGallery,
        addGalleryImage,
        removeGalleryImage,
        renameGalleryImage,
        getManualClients,
        addManualClient,
        addCustomCategory,
        getProfile,
        setProfile,
        addConversation,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
