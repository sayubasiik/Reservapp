import type { ServiceDetail } from '../types';
import { businessIdForService } from './businesses';

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

  /* ---- Restaurante: se reserva mesa indicando cuántas personas ---- */
  terraza: {
    id: 'terraza',
    name: 'Restaurante La Terraza',
    price: 300,
    rating: 4.6,
    reviewCount: 152,
    image: '/images/spa-relax.svg',
    address: 'Av. Reforma 222, Col. Juárez',
    description:
      'Cocina de autor con terraza al aire libre. Reserva tu mesa indicando cuántas personas son y te asignamos la mesa disponible que mejor se acomode. El precio es el consumo promedio por persona.',
    duration: '2 h por mesa',
    reviews: [
      { id: 'r1', initials: 'P', name: 'Pedro R.', rating: 5 },
      { id: 'r2', initials: 'L', name: 'Lucía M.', rating: 4 },
      { id: 'r3', initials: 'A', name: 'Andrés S.', rating: 5 },
    ],
  },

  /* ---- Hotel Brisa: cada cuarto es un servicio reservable ---- */
  'hotel-brisa-sencilla': {
    id: 'hotel-brisa-sencilla',
    name: 'Hotel Brisa · Habitación Sencilla',
    price: 900,
    rating: 4.5,
    reviewCount: 48,
    image: '/images/spa-relax.svg',
    address: 'Av. del Mar 100, Zona Hotelera',
    description:
      'Habitación sencilla con cama matrimonial, aire acondicionado, TV y desayuno incluido. Ideal para una persona. Precio por noche.',
    duration: '1 noche',
    reviews: [
      { id: 'r1', initials: 'R', name: 'Raúl M.', rating: 5 },
      { id: 'r2', initials: 'T', name: 'Tania P.', rating: 4 },
    ],
  },
  'hotel-brisa-doble': {
    id: 'hotel-brisa-doble',
    name: 'Hotel Brisa · Habitación Doble',
    price: 1400,
    rating: 4.7,
    reviewCount: 63,
    image: '/images/spa-relax.svg',
    address: 'Av. del Mar 100, Zona Hotelera',
    description:
      'Habitación con dos camas, balcón con vista al mar, aire acondicionado y desayuno incluido. Para hasta 4 personas. Precio por noche.',
    duration: '1 noche',
    reviews: [
      { id: 'r1', initials: 'A', name: 'Ana L.', rating: 5 },
      { id: 'r2', initials: 'J', name: 'Jorge V.', rating: 5 },
    ],
  },
  'hotel-brisa-suite': {
    id: 'hotel-brisa-suite',
    name: 'Hotel Brisa · Suite',
    price: 2500,
    rating: 4.9,
    reviewCount: 34,
    image: '/images/spa-relax.svg',
    address: 'Av. del Mar 100, Zona Hotelera',
    description:
      'Suite de lujo con sala, jacuzzi, vista panorámica al mar y servicio a la habitación 24/7. Precio por noche.',
    duration: '1 noche',
    reviews: [
      { id: 'r1', initials: 'M', name: 'Mónica R.', rating: 5 },
      { id: 'r2', initials: 'D', name: 'Diego S.', rating: 5 },
    ],
  },

  /* ---- Salón Jardín Real: cada salón se aparta completo por evento ---- */
  'salon-jardin-cristal': {
    id: 'salon-jardin-cristal',
    name: 'Salón Jardín Real · Salón Cristal',
    price: 380,
    rating: 4.8,
    reviewCount: 57,
    image: '/images/salon-jardin.svg',
    address: 'Av. de los Fresnos 450, Col. Las Flores',
    description:
      'Salón techado con capacidad para 250 invitados: mobiliario, mantelería, pista de baile e iluminación incluidos. Aparta el salón completo para tu evento y elige el turno. El precio es por invitado (paquete con banquete).',
    duration: 'Turno de 6 h',
    reviews: [
      { id: 'r1', initials: 'G', name: 'Gabriela M.', rating: 5 },
      { id: 'r2', initials: 'H', name: 'Héctor N.', rating: 5 },
      { id: 'r3', initials: 'C', name: 'Claudia B.', rating: 4 },
    ],
  },
  'salon-jardin-terraza': {
    id: 'salon-jardin-terraza',
    name: 'Salón Jardín Real · Terraza Jardín',
    price: 450,
    rating: 4.9,
    reviewCount: 41,
    image: '/images/salon-jardin.svg',
    address: 'Av. de los Fresnos 450, Col. Las Flores',
    description:
      'Terraza al aire libre con jardín, pérgola y área para ceremonia. Hasta 150 invitados. Incluye mobiliario, montaje y servicio de meseros. El precio es por invitado (paquete con banquete).',
    duration: 'Turno de 6 h',
    reviews: [
      { id: 'r1', initials: 'S', name: 'Sofía R.', rating: 5 },
      { id: 'r2', initials: 'E', name: 'Emilio T.', rating: 5 },
    ],
  },
  'salon-jardin-vip': {
    id: 'salon-jardin-vip',
    name: 'Salón Jardín Real · Sala VIP',
    price: 300,
    rating: 4.7,
    reviewCount: 29,
    image: '/images/salon-jardin.svg',
    address: 'Av. de los Fresnos 450, Col. Las Flores',
    description:
      'Sala privada para eventos pequeños: cumpleaños, juntas o despedidas. Hasta 60 invitados, con pantalla, audio y servicio de café. El precio es por invitado.',
    duration: 'Turno de 4 h',
    reviews: [
      { id: 'r1', initials: 'N', name: 'Natalia C.', rating: 5 },
      { id: 'r2', initials: 'O', name: 'Omar P.', rating: 4 },
    ],
  },
};

// Servicios que ofrece un negocio (el hotel tiene uno por tipo de habitación).
export function servicesOfBusiness(businessId?: string): ServiceDetail[] {
  if (!businessId) return [];
  return Object.values(serviceDetails).filter((s) => businessIdForService(s.id) === businessId);
}
