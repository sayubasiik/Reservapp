import type { Category } from '../types';
import './Cards.css';

interface CategoryCardProps {
  category: Category;
}

// Tarjeta reutilizable para cada categoría.
// El color de fondo se aplica con una clase modificadora (BEM): category-card--blue, etc.
export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <button className={`category-card category-card--${category.color}`}>
      <span className="category-card__icon">{category.icon}</span>
      {category.name && <span className="category-card__label">{category.name}</span>}
    </button>
  );
}
