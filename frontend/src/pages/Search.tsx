import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { searchResults, recentSearches, searchFilters } from '../data/exploreData';
import '../styles/variables.css';
import './Search.css';

// Pantalla 13/20 — Búsqueda (resultados)
export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('Corte de cabello');

  return (
    <div className="se">
      <Navbar active="Servicios" />

      <main className="se__container">
        {/* Barra de búsqueda */}
        <div className="se__searchbar">
          <span className="se__search-icon">🔍</span>
          <input
            className="se__search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar servicio, lugar..."
          />
          {query && (
            <button className="se__clear" onClick={() => setQuery('')} aria-label="Limpiar">✕</button>
          )}
        </div>

        {/* Filtros */}
        <div className="se__filters">
          <button className="se__filter se__filter--primary">⚙ Filtros</button>
          {searchFilters.map((f) => (
            <button key={f} className="se__filter">{f} ▾</button>
          ))}
        </div>

        {/* Búsquedas recientes */}
        <section className="se__section">
          <h2 className="se__section-title">Búsquedas recientes</h2>
          <div className="se__chips">
            {recentSearches.map((r) => (
              <button key={r} className="se__chip" onClick={() => setQuery(r)}>
                {r} <span className="se__chip-x">✕</span>
              </button>
            ))}
          </div>
        </section>

        {/* Resultados */}
        <h2 className="se__section-title">Resultados ({searchResults.length})</h2>
        <div className="se__results">
          {searchResults.map((r) => (
            <article
              key={r.id}
              className="se__result"
              onClick={() => navigate(`/servicio/${r.id}`)}
            >
              <div className={`se__result-thumb se__result-thumb--${r.color}`}>🖼️</div>
              <div className="se__result-body">
                <h3 className="se__result-name">{r.name}</h3>
                <p className="se__result-meta">{r.category} · {r.address}</p>
                <p className="se__result-price">
                  Desde ${r.price} <span className="se__result-rating">★ {r.rating}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="se__footer">reservvap.com/buscar?q=corte</footer>
    </div>
  );
}
