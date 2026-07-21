import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/AuthContext';
import { userProfile, profileMenu } from '../data/exploreData';
import '../styles/variables.css';
import './Profile.css';

// Pantalla 15/20 — Perfil
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Datos del usuario en sesión (con respaldo en los datos demo).
  const name = user?.name ?? userProfile.name;
  const initials = user?.initials ?? userProfile.initials;
  const email = user?.email ?? userProfile.email;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pf">
      <Navbar active="Perfil" userInitials={initials} />

      <main className="pf__container">
        {/* Cabecera del usuario */}
        <section className="pf__header">
          <div className="pf__avatar">{initials}</div>
          <div className="pf__ident">
            <h1 className="pf__name">{name}</h1>
            <p className="pf__contact">{email}</p>
            <p className="pf__contact">{userProfile.phone}</p>
          </div>
          <button className="pf__edit">✎ Editar perfil</button>
        </section>

        {/* Estadísticas */}
        <section className="pf__stats">
          <div className="pf__stat">
            <span className="pf__stat-value">{userProfile.totalReservations}</span>
            <span className="pf__stat-label">Reservas totales</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{userProfile.favorites}</span>
            <span className="pf__stat-label">Favoritos</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{userProfile.memberSince}</span>
            <span className="pf__stat-label">Miembro desde</span>
          </div>
        </section>

        {/* Menú de opciones */}
        <section className="pf__menu">
          {profileMenu.map((item) => (
            <button key={item.label} className="pf__menu-item">
              <span className="pf__menu-icon">{item.icon}</span>
              <span className="pf__menu-label">{item.label}</span>
              <span className="pf__menu-chevron">›</span>
            </button>
          ))}
        </section>

        {/* Cerrar sesión */}
        <button className="pf__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </main>

      <footer className="pf__footer">reservvap.com/perfil</footer>
    </div>
  );
}
