import type {
  ReactNode,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import './AdminLayout.css';

const adminNav = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: '▦',
  },
  {
    label: 'Recursos',
    path: '/admin/recursos',
    icon: 'R',
  },
  {
    label: 'Reportes',
    path: '/admin/reportes',
    icon: '▤',
  },
  {
    label: 'Configuración',
    path: '/admin/configuracion',
    icon: '⚙',
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    logout,
  } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="ad">
      <aside className="ad__sidebar">
        <div
          className="ad__brand"
          onClick={() =>
            navigate('/admin')
          }
          style={{
            cursor: 'pointer',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              navigate('/admin');
            }
          }}
        >
          <span className="ad__logo">
            RV
          </span>

          <div>
            <span className="ad__brand-name">
              {user?.businessName ??
                user?.name ??
                'ReservApp'}
            </span>

            <span className="ad__brand-sub">
              Panel Administrador
            </span>
          </div>
        </div>

        <nav
          className="ad__nav"
          aria-label="Navegación del negocio"
        >
          {adminNav.map(
            (item) => (
              <button
                type="button"
                key={item.path}
                className={
                  `ad__nav-item ${
                    location.pathname ===
                    item.path
                      ? 'is-active'
                      : ''
                  }`
                }
                onClick={() =>
                  navigate(item.path)
                }
              >
                <span className="ad__nav-icon">
                  {item.icon}
                </span>

                {item.label}
              </button>
            ),
          )}
        </nav>

        <div className="ad__account">
          <span className="ad__account-avatar">
            {user?.initials ?? 'RV'}
          </span>

          <span className="ad__account-name">
            {user?.name ??
              'Administrador'}
          </span>

          <button
            type="button"
            className="ad__logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ad__main">
        {children}
      </main>
    </div>
  );
}
