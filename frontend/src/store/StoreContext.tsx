import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_CAPACITY } from '../data/slots';

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
  date: string;        // ISO yyyy-mm-dd (para calcular disponibilidad)
  dateLabel: string;   // "14 Julio 2026" (para mostrar)
  time: string;        // "10:00 AM"
  customerName: string;
  status: ResStatus;
  createdAt: number;
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
}

// Mesa de un restaurante (administrada por el dueño del negocio).
export interface Table {
  id: string;
  seats: number;   // para cuántas personas
}

interface StoreState {
  favorites: string[];                    // ids de servicios
  capacity: Record<string, number>;       // horario -> nº de espacios
  reservations: Reservation[];
  conversations: Conversation[];
  tables: Record<string, Table[]>;        // businessId -> mesas
}

interface StoreValue extends StoreState {
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setCapacity: (time: string, n: number) => void;
  getAvailable: (serviceId: string, dateISO: string, time: string) => number;
  book: (r: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => boolean;
  acceptReservation: (id: string) => void;
  cancelReservation: (id: string) => void;
  sendMessage: (convId: string, text: string) => void;
  readConversation: (convId: string) => void;
  getTables: (businessId?: string) => Table[];
  addTable: (businessId: string, seats: number) => void;
  removeTable: (businessId: string, tableId: string) => void;
  setTableSeats: (businessId: string, tableId: string, seats: number) => void;
}

/* ---- Datos iniciales (semilla) ---- */
const seedReservations: Reservation[] = [
  { id: 's1', serviceId: 'barberia-elite', serviceName: 'Barbería Elite', image: '/images/barberia-elite.svg', address: 'Av. Universidad 123',      date: '2026-07-14', dateLabel: '14 Julio 2026', time: '10:00 AM', customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 1 },
  { id: 's2', serviceId: 'spa-relax',      serviceName: 'Spa Relax',      image: '/images/spa-relax.svg',      address: 'Paseo de la Reforma 500', date: '2026-07-22', dateLabel: '22 Julio 2026', time: '4:00 PM',  customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 2 },
  { id: 's3', serviceId: 'clinica-dental', serviceName: 'Clínica Dental', image: '/images/clinica-dental.svg', address: 'Insurgentes Sur 300',     date: '2026-07-28', dateLabel: '28 Julio 2026', time: '2:00 PM',  customerName: 'Olaf Andrade', status: 'pendiente',  createdAt: 3 },
  { id: 's4', serviceId: 'yoga-studio',    serviceName: 'Yoga Studio',    image: '/images/yoga-studio.svg',    address: 'Polanco, CDMX',          date: '2026-08-01', dateLabel: '1 Agosto 2026', time: '8:00 AM',  customerName: 'Olaf Andrade', status: 'confirmada', createdAt: 4 },
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
  reservations: seedReservations,
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
};

const STORAGE_KEY = 'reservvap_store';

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...initialState, ...(JSON.parse(raw) as StoreState) };
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

  const setCapacity = (time: string, n: number) =>
    setState((s) => ({ ...s, capacity: { ...s.capacity, [time]: Math.max(0, n) } }));

  const getAvailable = (serviceId: string, dateISO: string, time: string) => {
    const cap = state.capacity[time] ?? 1;
    const taken = state.reservations.filter(
      (r) => r.serviceId === serviceId && r.date === dateISO && r.time === time && r.status !== 'cancelada',
    ).length;
    return Math.max(0, cap - taken);
  };

  const book: StoreValue['book'] = (r) => {
    if (getAvailable(r.serviceId, r.date, r.time) <= 0) return false;
    const reservation: Reservation = {
      ...r,
      id: `r-${Date.now()}`,
      status: 'pendiente',
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, reservations: [reservation, ...s.reservations] }));
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

  return (
    <StoreContext.Provider
      value={{
        ...state,
        toggleFavorite,
        isFavorite,
        setCapacity,
        getAvailable,
        book,
        acceptReservation,
        cancelReservation,
        sendMessage,
        readConversation,
        getTables,
        addTable,
        removeTable,
        setTableSeats,
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
