// Negocios de la plataforma. Cada administrador es dueño de uno,
// y en el panel solo ve la información de su propio negocio.

// Giro/categoría del negocio (lo que se elige al crear una cuenta de negocio).
export type BusinessType = 'alimentos' | 'ejercicio' | 'belleza' | 'medico';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
}

export const businesses: Business[] = [
  { id: 'barberia-elite', name: 'Barbería Elite',        type: 'belleza' },
  { id: 'spa-relax',      name: 'Spa Relax',             type: 'belleza' },
  { id: 'clinica-dental', name: 'Clínica Dental',        type: 'medico' },
  { id: 'yoga-studio',    name: 'Yoga Studio',           type: 'ejercicio' },
  { id: 'terraza',        name: 'Restaurante La Terraza', type: 'alimentos' },
];

// Categorías disponibles al registrar un negocio (con su ícono).
export interface BusinessCategory {
  type: BusinessType;
  label: string;
  icon: string;
}

export const businessCategories: BusinessCategory[] = [
  { type: 'alimentos', label: 'Alimentos', icon: '🍽️' },
  { type: 'ejercicio', label: 'Ejercicio', icon: '🏋️' },
  { type: 'belleza',   label: 'Belleza',   icon: '💇' },
  { type: 'medico',    label: 'Médico',    icon: '🩺' },
];

export const businessById = (id?: string) => businesses.find((b) => b.id === id);

// Iniciales a partir del nombre del negocio (p. ej. "Barbería Elite" -> "BE").
export function businessInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Convierte un nombre en un id legible (para negocios recién creados).
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `negocio-${Date.now()}`;
}
