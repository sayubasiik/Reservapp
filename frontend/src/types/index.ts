// Interfaces de datos que consume la pantalla de Inicio.
// Al tiparlas, TypeScript nos avisa si falta un campo o el tipo no coincide.

/** Colores de fondo disponibles para una categoría */
export type CategoryColor = 'blue' | 'pink' | 'amber' | 'green' | 'gray';

/** Una categoría de servicio (Médico, Belleza, etc.) */
export interface Category {
  id: string;
  name: string;
  icon: string;         // emoji que representa la categoría
  color: CategoryColor; // clave del color de fondo
}

/** Un servicio destacado en "Servicios populares" */
export interface Service {
  id: string;
  name: string;
  price: number;  // precio "Desde $"
  rating: number; // calificación 0-5
  image: string;  // ruta de la imagen
}

/** Detalle completo de un servicio */
export interface ServiceDetail {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  description: string;
  duration: string;
  reviews: Review[];
}

/** Reseña de un usuario */
export interface Review {
  id: string;
  initials: string;
  name: string;
  rating: number;
  comment?: string;
}
