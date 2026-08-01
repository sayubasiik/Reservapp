import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const firstName = (user?.name ?? 'Olaf').split(' ')[0];
  const [query, setQuery] = useState('');

  // Lleva a la pantalla de resultados con el texto escrito.
  const runSearch = () => {
    navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  // "Ver todas" y las categorías abren la búsqueda con el filtro elegido.
  const openSearch = (params = '') => navigate(`/buscar${params}`);

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
        <form
          className="home__search"
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
        >
          <div className="home__search-field">
            <span className="home__search-icon">🔍</span>
            <input
              type="text"
              className="home__search-input"
              placeholder="Buscar servicio, lugar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="home__search-btn">IR</button>
        </form>

        {/* Categorías */}
        <section className="home__section">
          <div className="home__section-head">
            <h2 className="home__section-title">Categorías</h2>
            <button type="button" className="home__link" onClick={() => openSearch()}>Ver todas</button>
          </div>
          <div className="home__categories">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onClick={() =>
                  openSearch(cat.id === 'mas' ? '' : `?cat=${encodeURIComponent(cat.name)}`)
                }
              />
            ))}
          </div>
        </section>

        {/* Servicios populares */}
        <section className="home__section">
          <div className="home__section-head">
            <h2 className="home__section-title">Servicios populares</h2>
            <button type="button" className="home__link" onClick={() => openSearch()}>Ver todas</button>
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
