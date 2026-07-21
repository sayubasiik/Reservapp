import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { galleryFilters, galleryItems } from '../data/adminData';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminGallery.css';

// Pantalla 18/20 — Galería (Panel Administrador)
export default function AdminGallery() {
  const [filter, setFilter] = useState('Todas');
  const { user } = useAuth();
  const bizName = user?.name;

  // Solo la galería de ESTE negocio; el resto de filtros se ocultan.
  const own = galleryItems.filter((g) => !bizName || g.business === bizName);
  const filters = bizName ? ['Todas'] : galleryFilters;
  const list = filter === 'Todas' ? own : own.filter((g) => g.business === filter);

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Galería</h1>
        <button className="ad__btn">⬆ Subir imagen</button>
      </header>

      {/* Filtros */}
      <div className="ag__filters">
        {filters.map((f) => (
          <button
            key={f}
            className={`ag__filter ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid de imágenes */}
      <div className="ag__grid">
        {list.map((g) => (
          <article key={g.title} className="ag__item">
            <div className={`ag__media ag__media--${g.color}`}>
              <span className="ag__thumb">🖼️</span>
              <div className="ag__tools">
                <button className="ag__tool" aria-label="Editar">✎</button>
                <button className="ag__tool" aria-label="Eliminar">🗑</button>
              </div>
            </div>
            <div className="ag__body">
              <h3 className="ag__title-item">{g.title}</h3>
              <p className="ag__business">{g.business}</p>
            </div>
          </article>
        ))}
      </div>

      <footer className="ad__footer">Galería · 18/20</footer>
    </AdminLayout>
  );
}
