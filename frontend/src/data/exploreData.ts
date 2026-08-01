import type { CategoryColor } from '../types';

// Datos mock para Búsqueda (13), Favoritos (14) y Perfil (15).
// En producción vendrían de GET /api/businesses?q=... y /api/users/me

export interface SearchResult {
  id: string;
  name: string;
  category: string;
  address: string;
  price: number;
  rating: number;
  color: CategoryColor;   // color del thumbnail
}

export const searchResults: SearchResult[] = [
  { id: 'barberia-elite', name: 'Barbería Elite', category: 'Belleza',  address: 'Av. Universidad 123',    price: 250, rating: 4.6, color: 'blue' },
  { id: 'spa-relax',      name: 'Spa Relax',      category: 'Belleza',  address: 'Paseo de la Reforma 500', price: 600, rating: 4.8, color: 'pink' },
  { id: 'clinica-dental', name: 'Clínica Dental', category: 'Médico',   address: 'Insurgentes Sur 300',     price: 800, rating: 4.7, color: 'amber' },
  { id: 'yoga-studio',    name: 'Yoga Studio',    category: 'Gimnasio', address: 'Polanco, CDMX',           price: 400, rating: 4.9, color: 'green' },
  { id: 'salon-bella',    name: 'Salón Bella Vita', category: 'Belleza', address: 'Condesa, CDMX',           price: 350, rating: 4.5, color: 'blue' },
  { id: 'terraza',        name: 'Restaurante La Terraza', category: 'Restaurante', address: 'Av. Reforma 222', price: 300, rating: 4.6, color: 'pink' },
  { id: 'hotel-brisa-sencilla', name: 'Hotel Brisa · Sencilla', category: 'Hotel', address: 'Av. del Mar 100', price: 900,  rating: 4.5, color: 'blue' },
  { id: 'hotel-brisa-doble',    name: 'Hotel Brisa · Doble',    category: 'Hotel', address: 'Av. del Mar 100', price: 1400, rating: 4.7, color: 'green' },
  { id: 'hotel-brisa-suite',    name: 'Hotel Brisa · Suite',    category: 'Hotel', address: 'Av. del Mar 100', price: 2500, rating: 4.9, color: 'amber' },
  { id: 'salon-jardin-cristal', name: 'Salón Jardín Real · Salón Cristal', category: 'Eventos', address: 'Av. de los Fresnos 450', price: 380, rating: 4.8, color: 'pink' },
  { id: 'salon-jardin-terraza', name: 'Salón Jardín Real · Terraza Jardín', category: 'Eventos', address: 'Av. de los Fresnos 450', price: 450, rating: 4.9, color: 'green' },
  { id: 'salon-jardin-vip',     name: 'Salón Jardín Real · Sala VIP',      category: 'Eventos', address: 'Av. de los Fresnos 450', price: 300, rating: 4.7, color: 'blue' },
];

export const recentSearches = ['Barbería', 'Spa', 'Yoga', 'Dentista'];

export const searchFilters = ['Categoría', 'Precio', 'Calificación', 'Distancia'];

export interface FavoriteService {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  color: CategoryColor;
}

export const favorites: FavoriteService[] = [
  { id: 'spa-relax',      name: 'Spa Relax',            price: 600, rating: 4.8, category: 'Belleza',     color: 'pink' },
  { id: 'yoga-studio',    name: 'Yoga Studio',          price: 400, rating: 4.9, category: 'Gimnasio',    color: 'green' },
  { id: 'clinica-dental', name: 'Clínica Dental',       price: 800, rating: 4.7, category: 'Médico',      color: 'amber' },
  { id: 'terraza',        name: 'Restaurante La Terraza', price: 300, rating: 4.6, category: 'Restaurante', color: 'pink' },
];

export const favoriteFilters = ['Todos', 'Belleza', 'Médico', 'Gimnasio', 'Restaurante'];

// Perfil del usuario actual
export const userProfile = {
  name: 'Olaf Andrade',
  initials: 'OA',
  email: 'olaf.andrade@correo.com',
  phone: '(55) 1234 5678',
  totalReservations: 12,
  favorites: 4,
  memberSince: 'Ene 2025',
};

export const profileMenu = [
  { icon: '👤', label: 'Mis datos personales' },
  { icon: '💳', label: 'Métodos de pago' },
  { icon: '🔔', label: 'Notificaciones' },
  { icon: '📍', label: 'Direcciones guardadas' },
  { icon: '❓', label: 'Ayuda y soporte' },
  { icon: '📄', label: 'Términos y condiciones' },
];
