import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import { useStore } from '../store/StoreContext';
import '../styles/variables.css';
import './Favorites.css';

// Categoría de cada servicio (para el filtro).
const categoryOf: Record<string, string> = {
  'barberia-elite': 'Belleza',
  'spa-relax': 'Belleza',
  'clinica-dental': 'Médico',
  'yoga-studio': 'Gimnasio',
};

const FILTERS = ['Todos', 'Belleza', 'Médico', 'Gimnasio'];

// Pantalla 14/20 — Mis Favoritos
export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useStore();
  const [filter, setFilter] = useState('Todos');

  // Mapea los ids favoritos a los datos del servicio.
  const items = favorites
    .map((id) => serviceDetails[id])
    .filter(Boolean)
    .filter((s) => filter === 'Todos' || categoryOf[s.id] === filter);

  return (
    <div className="fv">
      <Navbar active="Favoritos" />

      <main className="fv__container">
        <header className="fv__head">
          <h1 className="fv__title">Mis Favoritos</h1>
          <p className="fv__subtitle">{favorites.length} servicios guardados</p>
        </header>

        {/* Filtros por categoría */}
        <div className="fv__filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`fv__filter ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid de favoritos */}
        {items.length === 0 ? (
          <p className="fv__empty">
            No tienes favoritos aquí. Toca el corazón 🤍 en cualquier servicio para guardarlo.
          </p>
        ) : (
          <div className="fv__grid">
            {items.map((s) => (
              <article
                key={s.id}
                className="fv__card"
                onClick={() => navigate(`/servicio/${s.id}`)}
              >
                <div
                  className="fv__card-media"
                  style={{ backgroundImage: `url(${s.image})` }}
                >
                  <button
                    className="fv__heart"
                    aria-label="Quitar de favoritos"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}
                  >
                    ❤️
                  </button>
                </div>
                <div className="fv__card-body">
                  <h3 className="fv__card-name">{s.name}</h3>
                  <div className="fv__card-row">
                    <span className="fv__card-price">Desde ${s.price}</span>
                    <span className="fv__card-rating">★ {s.rating}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="fv__footer">reservapp.com/favoritos</footer>
    </div>
  );
}
