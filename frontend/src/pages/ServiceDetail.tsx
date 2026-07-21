import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import type { Review } from '../types';
import '../styles/variables.css';
import './ServiceDetail.css';

// Pantalla 5/12 — Detalle del Servicio
export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = id ? serviceDetails[id] : undefined;

  // Usuario actual (vendría del AuthContext)
  const userName = 'Olaf A.';
  const userInitials = 'OA';

  const [extraReviews, setExtraReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formComment, setFormComment] = useState('');
  const [formRating, setFormRating] = useState(5);

  if (!service) {
    return (
      <div className="sd">
        <Navbar />
        <main className="sd__container">
          <p>Servicio no encontrado.</p>
        </main>
      </div>
    );
  }

  const allReviews = [...service.reviews, ...extraReviews];

  const handleSubmitReview = () => {
    const newReview: Review = {
      id: `user-${Date.now()}`,
      initials: userInitials,
      name: userName,
      rating: formRating,
      comment: formComment.trim() || undefined,
    };
    setExtraReviews((prev) => [newReview, ...prev]);
    setFormComment('');
    setFormRating(5);
    setShowForm(false);
  };

  // Genera estrellas llenas según el rating (redondeado)
  const stars = (rating: number) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return (
    <div className="sd">
      <Navbar />

      <main className="sd__container">
        {/* Imagen hero con botón de regreso */}
        <section className="sd__hero">
          <div
            className="sd__hero-image"
            style={{ backgroundImage: `url(${service.image})` }}
          />
          <button className="sd__back" onClick={() => navigate(-1)} aria-label="Regresar">
            ← {service.name}
          </button>
        </section>

        {/* Info principal */}
        <section className="sd__info">
          <h1 className="sd__name">{service.name}</h1>
          <div className="sd__rating-row">
            <span className="sd__stars">{stars(service.rating)}</span>
            <span className="sd__review-count">({service.reviewCount + extraReviews.length} reseñas)</span>
          </div>
          <p className="sd__address">
            <span className="sd__address-icon">📍</span> {service.address}
          </p>
        </section>

        {/* Descripción */}
        <section className="sd__section">
          <h2 className="sd__section-title">Descripción</h2>
          <p className="sd__description">{service.description}</p>
        </section>

        {/* Precio y duración */}
        <div className="sd__meta">
          <div className="sd__meta-card">
            <span className="sd__meta-label">Precio</span>
            <span className="sd__meta-value">${service.price}</span>
          </div>
          <div className="sd__meta-card">
            <span className="sd__meta-label">Duración</span>
            <span className="sd__meta-value">{service.duration}</span>
          </div>
        </div>

        {/* Botón reservar */}
        <button className="sd__reserve-btn" onClick={() => navigate(`/reservar/${service.id}/fecha`)}>
          Reservar ahora
        </button>

        {/* Reseñas recientes */}
        <section className="sd__section">
          <div className="sd__section-head">
            <h2 className="sd__section-title">Reseñas recientes</h2>
            <button className="sd__add-review-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : '+ Añadir reseña'}
            </button>
          </div>

          {/* Formulario de nueva reseña */}
          {showForm && (
            <div className="sd__review-form">
              <div className="sd__review-rating-picker">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`sd__review-star-btn ${n <= formRating ? 'is-filled' : ''}`}
                    onClick={() => setFormRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="sd__review-input"
                placeholder="Escribe un comentario corto..."
                maxLength={120}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
              />
              <button className="sd__review-submit" onClick={handleSubmitReview}>
                Publicar
              </button>
            </div>
          )}

          <div className="sd__reviews">
            {allReviews.map((review) => (
              <div key={review.id} className="sd__review">
                <div className="sd__review-avatar">{review.initials}</div>
                <div className="sd__review-body">
                  <span className="sd__review-name">{review.name}</span>
                  <span className="sd__review-stars">{stars(review.rating)}</span>
                  {review.comment && <p className="sd__review-comment">{review.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="sd__footer">reservvap.com/servicio/{service.id}</footer>
    </div>
  );
}
