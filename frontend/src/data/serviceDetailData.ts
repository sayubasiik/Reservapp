import type { ServiceDetail } from '../types';

// Datos mock de detalle de cada servicio.
// En producción vendrían de GET /api/businesses/:id

export const serviceDetails: Record<string, ServiceDetail> = {
  'barberia-elite': {
    id: 'barberia-elite',
    name: 'Barbería Elite',
    price: 250,
    rating: 4.6,
    reviewCount: 138,
    image: '/images/barberia-elite.svg',
    address: 'Av. Universidad 123, Col. Centro',
    description:
      'Corte profesional, afeitado y tratamientos para el cuidado personal. Contamos con barberos expertos y productos de alta calidad.',
    duration: '45 min',
    reviews: [
      { id: 'r1', initials: 'J', name: 'Juan P.', rating: 5 },
      { id: 'r2', initials: 'M', name: 'María L.', rating: 5 },
      { id: 'r3', initials: 'C', name: 'Carlos R.', rating: 5 },
    ],
  },
  'spa-relax': {
    id: 'spa-relax',
    name: 'Spa Relax',
    price: 600,
    rating: 4.8,
    reviewCount: 95,
    image: '/images/spa-relax.svg',
    address: 'Blvd. Reforma 456, Col. Juárez',
    description:
      'Masajes relajantes, faciales y tratamientos corporales en un ambiente de paz y armonía. Ideal para desconectar del estrés.',
    duration: '60 min',
    reviews: [
      { id: 'r1', initials: 'A', name: 'Ana G.', rating: 5 },
      { id: 'r2', initials: 'R', name: 'Roberto S.', rating: 4 },
      { id: 'r3', initials: 'L', name: 'Laura M.', rating: 5 },
    ],
  },
  'clinica-dental': {
    id: 'clinica-dental',
    name: 'Clínica Dental',
    price: 800,
    rating: 4.7,
    reviewCount: 210,
    image: '/images/clinica-dental.svg',
    address: 'Calle Salud 789, Col. Doctores',
    description:
      'Limpieza dental, blanqueamiento y tratamientos de ortodoncia con tecnología de punta. Tu sonrisa en las mejores manos.',
    duration: '30 min',
    reviews: [
      { id: 'r1', initials: 'P', name: 'Pedro H.', rating: 5 },
      { id: 'r2', initials: 'S', name: 'Sandra V.', rating: 4 },
      { id: 'r3', initials: 'D', name: 'Diego F.', rating: 5 },
    ],
  },
  'yoga-studio': {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    price: 400,
    rating: 4.9,
    reviewCount: 76,
    image: '/images/yoga-studio.svg',
    address: 'Av. Chapultepec 321, Col. Roma',
    description:
      'Clases de yoga para todos los niveles: Hatha, Vinyasa y meditación guiada. Conecta cuerpo y mente en nuestro espacio.',
    duration: '50 min',
    reviews: [
      { id: 'r1', initials: 'V', name: 'Valeria T.', rating: 5 },
      { id: 'r2', initials: 'F', name: 'Fernando K.', rating: 5 },
      { id: 'r3', initials: 'I', name: 'Isabel N.', rating: 4 },
    ],
  },
};
