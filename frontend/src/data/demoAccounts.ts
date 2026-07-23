// Cuentas de prueba de la maqueta.
// Se siembran en localStorage al abrir la app (ver AuthContext) y se listan
// en el cuadro de "Cuentas de prueba" del login para poder entrar con un clic.

import { businesses, businessInitials } from './businesses';
import type { BusinessType } from './businesses';
import { defaultBookingMode, bookingModeLabel } from './bookingModes';
import type { BookingMode } from './bookingModes';

export interface DemoAccount {
  role: 'customer' | 'admin';
  name: string;
  email: string;
  password: string;
  phone?: string;
  note: string;                 // para qué sirve esta cuenta (se muestra en el login)
  businessId?: string;          // solo admin
  businessType?: BusinessType;  // solo admin
  mode?: BookingMode;           // solo admin: tipo de reserva del negocio
}

/* ---- Clientes ---- */
export const demoCustomers: DemoAccount[] = [
  {
    role: 'customer',
    name: 'Olaf Andrade',
    email: 'olaf.andrade@correo.com',
    password: '123456',
    phone: '(55) 1234 5678',
    note: 'Cuenta con reservas, favoritos y tarjeta guardada.',
  },
  {
    role: 'customer',
    name: 'María López',
    email: 'maria.lopez@correo.com',
    password: 'cliente123',
    phone: '(55) 2345 6789',
    note: 'Cuenta limpia, sin reservas (para probar el flujo desde cero).',
  },
  {
    role: 'customer',
    name: 'Juan Pérez',
    email: 'juan.perez@correo.com',
    password: 'cliente123',
    phone: '(55) 3456 7890',
    note: 'Segundo cliente, útil para ver dos reservas en el mismo horario.',
  },
  {
    role: 'customer',
    name: 'Ana García',
    email: 'ana.garcia@correo.com',
    password: 'cliente123',
    phone: '(55) 4567 8901',
    note: 'Tercer cliente, para probar cupos llenos y listas de espera.',
  },
];

// Qué se puede probar con cada negocio.
const adminNotes: Record<string, string> = {
  'barberia-elite': 'Citas por hora, una persona por espacio.',
  'spa-relax': 'Citas por hora con varios espacios por horario.',
  'clinica-dental': 'Consultas por hora (agenda médica).',
  'yoga-studio': 'Clases por cupo: varias personas en el mismo horario.',
  'terraza': 'Reserva de mesa eligiendo número de personas.',
  'hotel-brisa': 'Hospedaje por día con check-in y check-out.',
  'salon-jardin': 'Salón de eventos: se aparta completo por turno indicando invitados.',
};

/* ---- Administradores (uno por negocio) ---- */
export const demoAdmins: DemoAccount[] = businesses.map((b) => {
  const mode = defaultBookingMode(b.type);
  return {
    role: 'admin' as const,
    name: b.name,
    email: `contacto@${b.id.replace(/-/g, '')}.com`,
    password: 'admin123',
    phone: '(55) 5555 0000',
    note: adminNotes[b.id] ?? `Reservas ${bookingModeLabel(mode).toLowerCase()}.`,
    businessId: b.id,
    businessType: b.type,
    mode,
  };
});

export const demoAccounts: DemoAccount[] = [...demoCustomers, ...demoAdmins];

export const demoInitials = (a: DemoAccount) => businessInitials(a.name);
