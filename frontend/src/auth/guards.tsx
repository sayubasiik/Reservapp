import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Requiere sesión iniciada (cualquier rol). Si no, manda al splash.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/bienvenida" replace />;
  return <>{children}</>;
}

// Requiere rol de administrador. Cliente → app de cliente; sin sesión → splash.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/bienvenida" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
