import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { businessInitials, slugify } from '../data/businesses';
import type { BusinessType } from '../data/businesses';
import { demoAccounts } from '../data/demoAccounts';

// Dos tipos de usuario según la rúbrica: cliente y dueño de negocio (admin).
export type Role = 'customer' | 'admin';

// Dirección guardada del cliente.
export interface SavedAddress {
  id: string;
  label: string;    // "Casa", "Trabajo", etc.
  address: string;  // dirección completa
}

// Método de pago guardado (solo se guardan los últimos 4 dígitos).
export interface SavedCard {
  id: string;
  brand: string;    // "Visa", "Mastercard", etc.
  last4: string;
  holder: string;
  expiry: string;   // MM/AA
}

// Preferencias de notificaciones del cliente.
export interface NotificationPrefs {
  reservations: boolean; // confirmaciones y cambios de reserva
  reminders: boolean;    // recordatorios previos a la cita
  promotions: boolean;   // ofertas y novedades
  email: boolean;        // copia por correo
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  reservations: true,
  reminders: true,
  promotions: false,
  email: true,
};

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  avatar?: string;             // foto de perfil (dataURL) — se edita en el perfil
  addresses?: SavedAddress[];  // direcciones guardadas (cliente)
  cards?: SavedCard[];         // métodos de pago (cliente)
  notifications?: NotificationPrefs; // preferencias de notificaciones (cliente)
  businessId?: string;         // solo admin: negocio que administra
  businessType?: BusinessType; // solo admin: giro del negocio
}

// Una cuenta guardada = usuario + contraseña. En producción viviría en la BD;
// aquí se persiste en localStorage para que el login valide de verdad.
interface Account extends AuthUser {
  password: string;
}

export interface RegisterData {
  role: Role;
  name: string;                // nombre de la persona o del negocio
  email: string;
  password: string;
  phone?: string;
  businessType?: BusinessType; // solo admin
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, role: Role) => AuthResult;
  register: (data: RegisterData) => AuthResult;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

/* ---- Cuentas de prueba (semilla) ----
   Varios clientes y un admin por cada negocio (ver data/demoAccounts.ts).
   Se listan en el cuadro de cuentas de prueba del login.
   El negocio del admin queda determinado por su credencial (no se elige). */
function seedAccounts(): Account[] {
  return demoAccounts.map((d) => {
    const base: Account = {
      id: d.businessId ? `admin-${d.businessId}` : `cust-${slugify(d.name)}`,
      role: d.role,
      name: d.name,
      initials: businessInitials(d.name),
      email: d.email,
      password: d.password,
      phone: d.phone,
    };
    if (d.role === 'admin') {
      return { ...base, businessId: d.businessId, businessType: d.businessType };
    }
    // El cliente principal arranca con datos de ejemplo; los demás, en blanco.
    const isMain = d.email === 'olaf.andrade@correo.com';
    return {
      ...base,
      addresses: isMain
        ? [{ id: 'a1', label: 'Casa', address: 'Av. Universidad 123, Col. Centro, CDMX' }]
        : [],
      cards: isMain
        ? [{ id: 'c1', brand: 'Visa', last4: '4242', holder: d.name, expiry: '08/28' }]
        : [],
      notifications: { ...DEFAULT_NOTIFICATIONS },
    };
  });
}

// Agrega las cuentas de prueba que falten a las ya guardadas en localStorage,
// para que al añadir una cuenta demo nueva aparezca sin tener que borrar datos.
function withDemoAccounts(saved: Account[]): Account[] {
  const emails = new Set(saved.map((a) => a.email.toLowerCase()));
  const missing = seedAccounts().filter((a) => !emails.has(a.email.toLowerCase()));
  return missing.length ? [...saved, ...missing] : saved;
}

const USER_KEY = 'reservvap_user';
const ACCOUNTS_KEY = 'reservvap_accounts';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehidrata la sesión guardada al recargar la página.
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Catálogo de cuentas (se siembra la primera vez).
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) return withDemoAccounts(JSON.parse(raw) as Account[]);
    } catch { /* ignora json inválido */ }
    return seedAccounts();
  });

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const login = (email: string, password: string, role: Role): AuthResult => {
    const mail = email.trim().toLowerCase();
    const acc = accounts.find((a) => a.email.toLowerCase() === mail && a.role === role);
    if (!acc) {
      return {
        ok: false,
        error: role === 'admin'
          ? 'No existe una cuenta de negocio con ese correo.'
          : 'No existe una cuenta con ese correo.',
      };
    }
    if (acc.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };
    const { password: _pw, ...rest } = acc;
    void _pw;
    setUser(rest);
    return { ok: true };
  };

  const register = (data: RegisterData): AuthResult => {
    const mail = data.email.trim().toLowerCase();
    if (accounts.some((a) => a.email.toLowerCase() === mail)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
    }
    let acc: Account;
    if (data.role === 'admin') {
      const businessId = slugify(data.name);
      acc = {
        id: `admin-${businessId}-${Date.now()}`,
        role: 'admin',
        name: data.name,
        initials: businessInitials(data.name),
        email: mail,
        password: data.password,
        phone: data.phone,
        businessId,
        businessType: data.businessType,
      };
    } else {
      acc = {
        id: `cust-${Date.now()}`,
        role: 'customer',
        name: data.name,
        initials: businessInitials(data.name),
        email: mail,
        password: data.password,
        phone: data.phone,
        addresses: [],
        cards: [],
        notifications: { ...DEFAULT_NOTIFICATIONS },
      };
    }
    setAccounts((prev) => [...prev, acc]);
    const { password: _pw, ...rest } = acc;
    void _pw;
    setUser(rest);
    return { ok: true };
  };

  // Actualiza el usuario en sesión y su cuenta guardada (perfil editable).
  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    setAccounts((prev) => prev.map((a) => (user && a.id === user.id ? { ...a, ...patch } : a)));
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acceso al contexto de autenticación.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
