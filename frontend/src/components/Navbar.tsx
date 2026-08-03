import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import './Navbar.css';

const navLinks: Array<{
  label: string;
  path: string;
}> = [
  {
    label: 'Servicios',
    path: '/buscar',
  },
  {
    label: 'Reservas',
    path: '/mis-reservas',
  },
];

interface NavbarProps {
  active?: string;
  userInitials?: string;
}

export default function Navbar({
  active = 'Inicio',
  userInitials,
}: NavbarProps) {
  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const initials =
    userInitials ??
    user?.initials ??
    'RV';

  const goTo = (
    path: string,
  ) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="rv-navbar">
      <div className="rv-navbar__inner">
        <div
          className="rv-navbar__brand"
          onClick={() =>
            goTo('/inicio')
          }
          style={{
            cursor: 'pointer',
          }}
          aria-label="Ir al inicio"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              goTo('/inicio');
            }
          }}
        >
          <span className="rv-navbar__logo">
            RV
          </span>

          <span className="rv-navbar__name">
            ReservApp
          </span>
        </div>

        <button
          type="button"
          className="rv-navbar__toggle"
          aria-label={
            menuOpen
              ? 'Cerrar menú'
              : 'Abrir menú'
          }
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen(
              (open) => !open,
            )
          }
        >
          ☰
        </button>

        <nav
          className={
            `rv-navbar__links ${
              menuOpen
                ? 'is-open'
                : ''
            }`
          }
          aria-label="Navegación principal"
        >
          {navLinks.map(
            (link) => (
              <a
                key={link.label}
                href={link.path}
                className={
                  `rv-navbar__link ${
                    active === link.label
                      ? 'is-active'
                      : ''
                  }`
                }
                onClick={(event) => {
                  event.preventDefault();
                  goTo(link.path);
                }}
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div
          className="rv-navbar__avatar"
          onClick={() =>
            goTo('/perfil')
          }
          style={{
            cursor: 'pointer',
          }}
          aria-label="Abrir perfil"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              goTo('/perfil');
            }
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
