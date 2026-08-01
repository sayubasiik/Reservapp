// Historial de ejemplo de los últimos ~3 meses (y algunas reservas próximas).
// Sirve para que el Dashboard, el Calendario y sobre todo el Reporte tengan
// datos que mostrar desde el primer arranque de la maqueta.
// En producción esto vendría de GET /api/negocios/:id/reservas?desde=&hasta=

import type { Reservation } from '../store/StoreContext';
import { businesses, businessIdForService } from './businesses';
import { serviceDetails } from './serviceDetailData';
import { defaultBookingMode, bookingTotal } from './bookingModes';
import type { PayMethod } from './payments';
import { payStatusFor } from './payments';
import { TIME_SLOTS } from './slots';
import { addDaysISO, todayISO, formatDateLabel, nextDayISO } from '../utils/datetime';

const DIAS_ATRAS = 90;      // profundidad del historial
const PASADAS = 20;         // reservas ya ocurridas por negocio
const PROXIMAS = 4;         // reservas por venir por negocio

const clientes = [
  'Juan Pérez', 'María López', 'Carlos Ruiz', 'Ana García',
  'Luis Torres', 'Fernanda Gómez', 'Roberto Silva', 'Diana Castro',
  'Pedro Ramírez', 'Lucía Méndez', 'Andrés Soto', 'Sofía Ramos',
];

// La proporción de la lista es la que se ve en la gráfica de métodos de pago.
const metodos: PayMethod[] = ['card', 'card', 'card', 'paypal', 'paypal', 'local'];

// Generador pseudoaleatorio con semilla: el historial de un negocio siempre
// sale igual, no cambia en cada recarga de la maqueta.
function rng(seed: number) {
  let s = seed % 2147483647;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const pick = <T,>(list: T[], r: number): T => list[Math.floor(r * list.length) % list.length];

export function seedHistory(): Reservation[] {
  const hoy = todayISO();
  const out: Reservation[] = [];

  businesses.forEach((biz, bi) => {
    // Servicios del negocio (los cuartos de hotel y los salones incluidos).
    const ids = Object.keys(serviceDetails).filter((id) => businessIdForService(id) === biz.id);
    if (ids.length === 0) return;

    const mode = defaultBookingMode(biz.type);
    const rand = rng(bi * 7919 + 13);

    for (let i = 0; i < PASADAS + PROXIMAS; i++) {
      const futura = i >= PASADAS;
      const svc = serviceDetails[pick(ids, rand())];
      const date = futura
        ? addDaysISO(hoy, 1 + Math.floor(rand() * 14))
        : addDaysISO(hoy, -(1 + Math.floor(rand() * DIAS_ATRAS)));
      const time = mode === 'dia' ? '3:00 PM' : pick(TIME_SLOTS, rand());
      const method = pick(metodos, rand());

      // Las próximas quedan a medias entre pendientes y confirmadas; en el
      // pasado casi todas se cumplieron y unas pocas se cancelaron.
      const status: Reservation['status'] = futura
        ? (rand() < 0.4 ? 'pendiente' : 'confirmada')
        : (rand() < 0.12 ? 'cancelada' : 'confirmada');

      const people = mode === 'evento'
        ? 60 + Math.floor(rand() * 140)
        : (mode === 'cupo' || mode === 'mesa') ? 1 + Math.floor(rand() * 4) : 1;
      const nights = mode === 'dia' ? 1 + Math.floor(rand() * 4) : 0;
      const checkOut = mode === 'dia' ? addDaysISO(date, nights) : undefined;

      out.push({
        id: `h-${biz.id}-${i}`,
        serviceId: svc.id,
        serviceName: svc.name,
        image: svc.image,
        address: svc.address,
        date,
        dateLabel: formatDateLabel(date),
        time,
        customerName: pick(clientes, rand()),
        status,
        createdAt: i,
        mode,
        people,
        total: bookingTotal(mode, svc.price, { nights, people }),
        payMethod: method,
        // Una reserva pasada que se cumplió ya se cobró, aunque fuera en el lugar.
        payStatus: !futura && status === 'confirmada' ? 'pagado' : payStatusFor(method),
        ...(mode === 'dia' && {
          checkOut: checkOut ?? nextDayISO(date),
          checkOutLabel: formatDateLabel(checkOut ?? nextDayISO(date)),
          checkOutTime: '12:00 PM',
          nights,
        }),
      });
    }
  });

  return out;
}
