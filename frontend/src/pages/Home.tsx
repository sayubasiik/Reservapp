import Navbar from '../components/Navbar';
import CategoryCard from '../components/CategoryCard';
import ServiceCard from '../components/ServiceCard';
import { categories, popularServices } from '../data/homeData';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './Home.css';

// Pantalla 4/20 — Inicio (Home)
export default function Home() {
  const { user } = useAuth();
  const firstName = (user?.name ?? 'Olaf').split(' ')[0];

  return (
    <div className="home">
      {/* Barra de navegación superior */}
      <Navbar active="Inicio" />

      <main className="home__container">
        {/* Banner de bienvenida con el usuario en sesión */}
        <section className="home__hero">
          <h1 className="home__greeting">Hola, {firstName} 👋</h1>
          <p className="home__subtitle">¿Qué servicio necesitas hoy?</p>
        </section>

        {/* Barra de búsqueda */}
        <div className="home__search">
          <div className="home__search-field">
            <span className="home__search-icon">🔍</span>
            <input
              type="text"
              className="home__search-input"
              placeholder="Buscar servicio, lugar..."
            />
          </div>
          <button className="home__search-btn">IR</button>
        </div>

        {/* Categorías */}
        <section className="home__section">
          <div className="home__section-head">
            <h2 className="home__section-title">Categorías</h2>
            <a href="#" className="home__link">Ver todas</a>
          </div>
          <div className="home__categories">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* Servicios populares */}
        <section className="home__section">
          <div className="home__section-head">
            <h2 className="home__section-title">Servicios populares</h2>
            <a href="#" className="home__link">Ver todas</a>
          </div>
          <div className="home__services">
            {popularServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="home__footer">reservvap.com/inicio</footer>
    </div>
  );
}
