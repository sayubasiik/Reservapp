import { useNavigate } from 'react-router-dom';
import type { Service } from '../types';
import { useStore } from '../store/StoreContext';
import './Cards.css';

interface ServiceCardProps {
  service: Service;
}

// Tarjeta reutilizable para cada servicio popular.
export default function ServiceCard({ service }: ServiceCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(service.id);

  return (
    <article className="service-card" onClick={() => navigate(`/servicio/${service.id}`)}>
      {/* Usamos background-image para recortar la foto automáticamente (cover) */}
      <div
        className="service-card__image"
        style={{ backgroundImage: `url(${service.image})` }}
      >
        {/* Corazón para agregar/quitar de favoritos sin abrir el servicio */}
        <button
          className={`service-card__fav ${fav ? 'is-active' : ''}`}
          aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
        >
          {fav ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="service-card__body">
        <h3 className="service-card__name">{service.name}</h3>
        <p className="service-card__price">Desde ${service.price}</p>
        <div className="service-card__rating">
          <span className="service-card__stars">★★★★★</span>
          <span className="service-card__score">{service.rating}</span>
        </div>
      </div>
    </article>
  );
}
