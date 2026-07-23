import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { searchResults, recentSearches } from '../data/exploreData';
import '../styles/variables.css';
import './Search.css';

// Quita acentos y pasa a minúsculas para comparar sin importar tildes.
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Categorías disponibles como filtros rápidos (a partir de los resultados).
const CATEGORIES = Array.from(new Set(searchResults.map((r) => r.category)));

// Pantalla 13/20 — Búsqueda (resultados)
export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('cat') ?? '');

  // Si se llega desde otra pantalla con ?q= o ?cat=, sincroniza el estado.
  useEffect(() => {
    setQuery(params.get('q') ?? '');
    setCategory(params.get('cat') ?? '');
  }, [params]);

  // Mantiene la URL en sync (para poder compartir/recargar la búsqueda).
  const updateQuery = (q: string) => {
    setQuery(q);
    const next = new URLSearchParams(params);
    if (q) next.set('q', q); else next.delete('q');
    setParams(next, { replace: true });
  };

  const toggleCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (category === c) { setCategory(''); next.delete('cat'); }
    else { setCategory(c); next.set('cat', c); }
    setParams(next, { replace: true });
  };

  // Filtrado real por texto (nombre, categoría o dirección) y por categoría.
  const results = useMemo(() => {
    const q = norm(query.trim());
    return searchResults.filter((r) => {
      const matchesText =
        !q || norm(r.name).includes(q) || norm(r.category).includes(q) || norm(r.address).includes(q);
      const matchesCat = !category || norm(r.category) === norm(category);
      return matchesText && matchesCat;
    });
  }, [query, category]);

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
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Buscar servicio, lugar..."
            autoFocus
          />
          {query && (
            <button className="se__clear" onClick={() => updateQuery('')} aria-label="Limpiar">✕</button>
          )}
        </div>

        {/* Filtros por categoría */}
        <div className="se__filters">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`se__filter ${category === c ? 'se__filter--primary' : ''}`}
              onClick={() => toggleCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Búsquedas recientes (solo si no hay texto escrito) */}
        {!query && (
          <section className="se__section">
            <h2 className="se__section-title">Búsquedas recientes</h2>
            <div className="se__chips">
              {recentSearches.map((r) => (
                <button key={r} className="se__chip" onClick={() => updateQuery(r)}>
                  {r} <span className="se__chip-x">🔍</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Resultados */}
        <h2 className="se__section-title">Resultados ({results.length})</h2>
        {results.length === 0 ? (
          <p className="se__empty">
            No encontramos servicios para “{query || category}”. Prueba con otra palabra.
          </p>
        ) : (
          <div className="se__results">
            {results.map((r) => (
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
        )}
      </main>

      <footer className="se__footer">reservvap.com/buscar</footer>
    </div>
  );
}
