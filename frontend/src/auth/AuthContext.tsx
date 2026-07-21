import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { businesses, businessById, businessInitials, slugify } from '../data/businesses';
import type { BusinessType } from '../data/businesses';

// Dos tipos de usuario según la rúbrica: cliente y dueño de negocio (admin).
export type Role = 'customer' | 'admin';

export interface AuthUser {
  role: Role;
  name: string;
  initials: string;
  email: string;
  businessId?: string;         // solo admin: negocio que administra
  businessType?: BusinessType; // solo admin: giro del negocio
}

// Opciones al iniciar sesión / registrar:
//  - businessId: entrar a un negocio existente (login)
//  - businessName + businessType: crear un negocio nuevo (registro)
export interface LoginOptions {
  businessId?: string;
  businessName?: string;
  businessType?: BusinessType;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (role: Role, options?: LoginOptions) => void;
  logout: () => void;
}

// Cliente demo. En producción vendría de POST /api/auth/login.
const CUSTOMER_USER: AuthUser = {
  role: 'customer',
  name: 'Olaf Andrade',
  initials: 'OA',
  email: 'olaf.andrade@correo.com',
};

// Construye el usuario admin, ya sea de un negocio existente o uno nuevo.
function makeAdmin(opts?: LoginOptions): AuthUser {
  // Negocio nuevo (registro): usa el nombre y giro capturados.
  if (opts?.businessName && opts.businessType) {
    const id = slugify(opts.businessName);
    return {
      role: 'admin',
      name: opts.businessName,
      initials: businessInitials(opts.businessName),
      email: `contacto@${id.replace(/-/g, '')}.com`,
      businessId: id,
      businessType: opts.businessType,
    };
  }
  // Negocio existente (login).
  const biz = businessById(opts?.businessId) ?? businesses[0];
  return {
    role: 'admin',
    name: biz.name,
    initials: businessInitials(biz.name),
    email: `contacto@${biz.id.replace(/-/g, '')}.com`,
    businessId: biz.id,
    businessType: biz.type,
  };
}

const STORAGE_KEY = 'reservvap_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehidrata la sesión guardada al recargar la página.
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = (role: Role, options?: LoginOptions) =>
    setUser(role === 'admin' ? makeAdmin(options) : CUSTOMER_USER);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
