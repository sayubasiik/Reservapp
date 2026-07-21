import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

// Enlaces centrales de navegación.
// "Inicio" está integrado en el logo (izquierda) y "Perfil" en el avatar (derecha).
const navLinks: { label: string; path: string }[] = [
  { label: 'Servicios', path: '/buscar' },
  { label: 'Reservas', path: '/mis-reservas' },
  { label: 'Favoritos', path: '/favoritos' },
];

interface NavbarProps {
  /** Enlace activo (se resalta y subraya). */
  active?: string;
  /** Iniciales del usuario para el avatar (vendrían del AuthContext). */
  userInitials?: string;
}

export default function Navbar({ active = 'Inicio', userInitials }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Iniciales: primero las del usuario en sesión, luego la prop, y por defecto "OA".
  const initials = userInitials ?? user?.initials ?? 'OA';

  return (
    <header className="rv-navbar">
      <div className="rv-navbar__inner">
        {/* Logo — integra "Inicio": navega al Home */}
        <div className="rv-navbar__brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} aria-label="Inicio">
          <span className="rv-navbar__logo">RV</span>
          <span className="rv-navbar__name">ReservVap</span>
        </div>

        {/* Botón hamburguesa: solo visible en móvil */}
        <button
          className="rv-navbar__toggle"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>

        {/* Enlaces de navegación */}
        <nav className={`rv-navbar__links ${menuOpen ? 'is-open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className={`rv-navbar__link ${active === link.label ? 'is-active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate(link.path); setMenuOpen(false); }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Avatar — integra "Perfil": navega a la pantalla de perfil */}
        <div
          className="rv-navbar__avatar"
          onClick={() => navigate('/perfil')}
          style={{ cursor: 'pointer' }}
          aria-label="Perfil"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
