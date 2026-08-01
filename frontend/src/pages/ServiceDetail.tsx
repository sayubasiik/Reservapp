import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getApiError } from '../api/client';
import {
  getCatalogItem,
} from '../catalog/catalog';
import Navbar from '../components/Navbar';

import type {
  CatalogItem,
} from '../catalog/catalog';

import '../styles/variables.css';
import './ServiceDetail.css';

function formatPrice(
  pricePerHour: number,
): string {
  if (pricePerHour === 0) {
    return 'Sin costo';
  }

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(pricePerHour);
}

function phoneHref(
  phone: string,
): string {
  return `tel:${phone.replace(
    /[^\d+]/g,
    '',
  )}`;
}

export default function ServiceDetail() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const resourceId =
    Number(id);

  const validId =
    Number.isInteger(resourceId) &&
    resourceId > 0;

  const [item, setItem] =
    useState<CatalogItem | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDetail =
    useCallback(
      async () => {
        if (!validId) {
          setItem(null);
          setError(
            'El identificador del servicio no es válido.',
          );
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          const data =
            await getCatalogItem(
              resourceId,
            );

          setItem(data);
        } catch (loadError) {
          setItem(null);
          setError(
            getApiError(loadError),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        resourceId,
        validId,
      ],
    );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return (
    <div className="sd">
      <Navbar active="Servicios" />

      <main className="sd__container">
        {isLoading && (
          <section
            className="sd__state"
            role="status"
          >
            <span className="sd__spinner" />
            <p>Cargando servicio…</p>
          </section>
        )}

        {!isLoading && error && (
          <section
            className="sd__state sd__state--error"
            role="alert"
          >
            <h1>
              No pudimos abrir el servicio
            </h1>

            <p>{error}</p>

            <div className="sd__state-actions">
              <button
                type="button"
                className="sd__secondary-btn"
                onClick={() =>
                  navigate('/buscar')
                }
              >
                Volver a buscar
              </button>

              {validId && (
                <button
                  type="button"
                  className="sd__primary-btn"
                  onClick={() =>
                    void loadDetail()
                  }
                >
                  Reintentar
                </button>
              )}
            </div>
          </section>
        )}

        {!isLoading &&
          !error &&
          item && (
            <>
              <section className="sd__hero">
                <div className="sd__hero-image">
                  <span className="sd__hero-initial">
                    {item.category
                      .trim()
                      .charAt(0)
                      .toUpperCase() ||
                      'R'}
                  </span>

                  <span className="sd__hero-category">
                    {item.category}
                  </span>
                </div>

                <button
                  type="button"
                  className="sd__back"
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  ← Regresar
                </button>
              </section>

              <section className="sd__info">
                <span className="sd__business">
                  {item.businessName}
                </span>

                <h1 className="sd__name">
                  {item.resourceName}
                </h1>

                <p className="sd__address">
                  {item.address}
                </p>

                {item.phone && (
                  <a
                    className="sd__phone"
                    href={phoneHref(
                      item.phone,
                    )}
                  >
                    Contactar: {item.phone}
                  </a>
                )}
              </section>

              <section className="sd__section">
                <h2 className="sd__section-title">
                  Descripción
                </h2>

                <p className="sd__description">
                  {item.description ||
                    'El negocio no ha agregado una descripción para este recurso.'}
                </p>
              </section>

              <div className="sd__meta">
                <div className="sd__meta-card">
                  <span className="sd__meta-label">
                    Precio por hora
                  </span>

                  <strong className="sd__meta-value">
                    {formatPrice(
                      item.pricePerHour,
                    )}
                  </strong>
                </div>

                <div className="sd__meta-card">
                  <span className="sd__meta-label">
                    Capacidad
                  </span>

                  <strong className="sd__meta-value">
                    {item.capacity}
                  </strong>
                </div>

                <div className="sd__meta-card">
                  <span className="sd__meta-label">
                    Categoría
                  </span>

                  <strong className="sd__meta-value sd__meta-value--text">
                    {item.category}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="sd__reserve-btn"
                disabled
                aria-describedby="sd-reserve-note"
              >
                Seleccionar fecha
              </button>

              <p
                className="sd__reserve-note"
                id="sd-reserve-note"
              >
                La reservación se habilitará en el
                siguiente bloque, cuando conectemos
                disponibilidad y horarios reales.
              </p>
            </>
          )}
      </main>

      <footer className="sd__footer">
        {item
          ? `reservapp.com/servicio/${item.resourceId}`
          : 'reservapp.com/servicio'}
      </footer>
    </div>
  );
}
