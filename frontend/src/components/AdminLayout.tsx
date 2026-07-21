import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AdminLayout.css';

// Enlaces del panel de administrador (con su ruta e ícono).
const adminNav = [
  { label: 'Dashboard',     path: '/admin',               icon: '▦' },
  { label: 'Calendario',    path: '/admin/calendario',    icon: '📅' },
  { label: 'Clientes',      path: '/admin/clientes',      icon: '👥' },
  { label: 'Galería',       path: '/admin/galeria',       icon: '🖼️' },
  { label: 'Mensajes',      path: '/admin/mensajes',      icon: '💬' },
  { label: 'Configuración', path: '/admin/configuracion', icon: '⚙️' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

// Shell reutilizable del Panel Administrador: barra lateral + contenido.
// Cada pantalla (Dashboard, Calendario, etc.) renderiza su propio contenido.
export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="ad">
      {/* ---- Barra lateral ---- */}
      <aside className="ad__sidebar">
        <div
          className="ad__brand"
          onClick={() => navigate('/admin')}
          style={{ cursor: 'pointer' }}
        >
          <span className="ad__logo">RV</span>
          <div>
            <span className="ad__brand-name">{user?.name ?? 'ReservVap'}</span>
            <span className="ad__brand-sub">Panel Administrador</span>
          </div>
        </div>

        <nav className="ad__nav">
          {adminNav.map((item) => (
            <button
              key={item.path}
              className={`ad__nav-item ${location.pathname === item.path ? 'is-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="ad__nav-icon">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        {/* Usuario en sesión + cerrar sesión */}
        <div className="ad__account">
          <span className="ad__account-avatar">{user?.initials ?? 'RV'}</span>
          <span className="ad__account-name">{user?.name ?? 'Administrador'}</span>
          <button className="ad__logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      {/* ---- Contenido de la pantalla ---- */}
      <main className="ad__main">{children}</main>
    </div>
  );
}
