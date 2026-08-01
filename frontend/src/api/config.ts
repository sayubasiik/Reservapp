const rawApiUrl =
  import.meta.env.VITE_API_URL ??
  'http://localhost:8000/api';

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const USE_REAL_API = {
  auth: true,
  catalog: true,
  reservations: true,

  // Sebastián todavía está desarrollando estos endpoints.
  dashboard: false,
  reports: false,

  // No existen en el backend desplegado.
  chat: false,
  favorites: false,
  payments: false,
  approval: false,
  gallery: false,
  schedules: false,
  tables: false,
} as const;

export type ApiDomain = keyof typeof USE_REAL_API;
