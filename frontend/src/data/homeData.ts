import type { Category, Service } from '../types';

// Datos de ejemplo (mock).
// En producción vendrían de la API de FastAPI mediante nuestro hook useApi.

export const categories: Category[] = [
  { id: 'medico',      name: 'Médico',      icon: '🩺',  color: 'blue' },
  { id: 'belleza',     name: 'Belleza',     icon: '💅',  color: 'pink' },
  { id: 'restaurante', name: 'Restaurante', icon: '🍽️', color: 'amber' },
  { id: 'gimnasio',    name: 'Gimnasio',    icon: '🏋️', color: 'green' },
  { id: 'mas',         name: '',            icon: '•••', color: 'gray' }, // tarjeta "ver más"
];

export const popularServices: Service[] = [
  { id: 'spa-relax',      name: 'Spa Relax',      price: 600, rating: 4.8, image: '/images/spa-relax.svg' },
  { id: 'barberia-elite', name: 'Barbería Elite', price: 250, rating: 4.6, image: '/images/barberia-elite.svg' },
  { id: 'clinica-dental', name: 'Clínica Dental', price: 800, rating: 4.7, image: '/images/clinica-dental.svg' },
  { id: 'yoga-studio',    name: 'Yoga Studio',    price: 400, rating: 4.9, image: '/images/yoga-studio.svg' },
];
