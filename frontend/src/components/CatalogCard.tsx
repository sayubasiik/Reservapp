import { useNavigate } from 'react-router-dom';

import type {
  CatalogItem,
} from '../catalog/catalog';

import './CatalogCard.css';

interface CatalogCardProps {
  item: CatalogItem;
  variant?: 'grid' | 'list';
}

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

function categoryInitial(
  category: string,
): string {
  return (
    category.trim().charAt(0).toUpperCase() ||
    'R'
  );
}

export default function CatalogCard({
  item,
  variant = 'grid',
}: CatalogCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={
        `catalog-card catalog-card--${variant}`
      }
      onClick={() =>
        navigate(
          `/servicio/${item.resourceId}`,
        )
      }
      aria-label={
        `Ver ${item.resourceName} de ${item.businessName}`
      }
    >
      <div
        className="catalog-card__visual"
        aria-hidden="true"
      >
        <span className="catalog-card__initial">
          {categoryInitial(item.category)}
        </span>

        <span className="catalog-card__category">
          {item.category}
        </span>
      </div>

      <div className="catalog-card__body">
        <span className="catalog-card__business">
          {item.businessName}
        </span>

        <h3 className="catalog-card__name">
          {item.resourceName}
        </h3>

        <p className="catalog-card__address">
          {item.address}
        </p>

        <div className="catalog-card__footer">
          <strong className="catalog-card__price">
            {formatPrice(
              item.pricePerHour,
            )}
            {item.pricePerHour > 0 &&
              ' / hora'}
          </strong>

          <span className="catalog-card__capacity">
            Capacidad: {item.capacity}
          </span>
        </div>
      </div>
    </button>
  );
}
