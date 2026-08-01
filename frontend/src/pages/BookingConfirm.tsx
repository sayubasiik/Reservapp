import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
import { serviceDetails } from '../data/serviceDetailData';
import { bookingSteps, bookingStep, bookingTotal, priceNote } from '../data/bookingModes';
import { useStore } from '../store/StoreContext';
import { formatDateLabel, nightsBetween } from '../utils/datetime';
import '../styles/variables.css';
import './BookingConfirm.css';

// Profesional que atiende (solo aplica a las citas por hora).
const staff: Record<string, string> = {
  'barberia-elite': 'Carlos Mendoza',
  'spa-relax': 'Andrea López',
  'clinica-dental': 'Dr. Ramírez',
  'yoga-studio': 'Fernanda Torres',
};

// Pantalla 8/20 — Confirmación de Reserva
export default function BookingConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    { date?: string; time?: string; checkOut?: string; people?: number } | null;
  const service = id ? serviceDetails[id] : undefined;
  const { getServiceBooking } = useStore();
  const cfg = getServiceBooking(id ?? '');
  const mode = cfg.mode;

  const date = state?.date ?? '';
  const checkOut = state?.checkOut ?? '';
  const people = state?.people ?? 1;
  const time = state?.time ?? (mode === 'dia' ? cfg.checkInTime : '');
  const nights = mode === 'dia' ? nightsBetween(date, checkOut) : 0;

  if (!service) {
    return (
      <div className="bc">
        <Navbar active="Reservas" />
        <main className="bc__container"><p>Servicio no encontrado.</p></main>
      </div>
    );
  }

  const total = bookingTotal(mode, service.price, { nights, people });

  const stars = (rating: number) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const handlePay = () => {
    navigate(`/reservar/${id}/pago`, { state: { date, time, checkOut, people } });
  };

  // Filas del resumen según el tipo de reserva.
  const rows: { label: string; value: string }[] = [
    { label: 'Servicio', value: service.name },
  ];

  if (mode === 'dia') {
    rows.push(
      { label: 'Check-in', value: `${formatDateLabel(date)} · ${cfg.checkInTime}` },
      { label: 'Check-out', value: `${formatDateLabel(checkOut)} · ${cfg.checkOutTime}` },
      { label: 'Noches', value: `${nights} ${nights === 1 ? 'noche' : 'noches'}` },
      { label: 'Huéspedes', value: `${people} ${people === 1 ? 'persona' : 'personas'}` },
    );
  } else {
    rows.push(
      { label: 'Fecha', value: date ? formatDateLabel(date) : '—' },
      { label: mode === 'evento' ? 'Turno' : 'Hora', value: time || '—' },
    );
    if (mode === 'mesa') {
      rows.push(
        { label: 'Personas', value: `${people} ${people === 1 ? 'persona' : 'personas'}` },
        { label: 'Mesa', value: 'Se asigna al confirmar el pago' },
      );
    } else if (mode === 'cupo') {
      rows.push({ label: 'Lugares', value: `${people} ${people === 1 ? 'lugar' : 'lugares'}` });
    } else if (mode === 'evento') {
      rows.push(
        { label: 'Invitados', value: `${people} ${people === 1 ? 'invitado' : 'invitados'}` },
        { label: 'Salón', value: 'Se aparta completo para tu evento' },
      );
    }
    rows.push({ label: 'Duración', value: service.duration.replace('min', 'minutos') });
    if (mode === 'hora' && staff[service.id]) {
      rows.push({ label: 'Te atiende', value: staff[service.id] });
    }
  }

  return (
    <div className="bc">
      <Navbar active="Reservas" />

      <main className="bc__container">
        <BookingSteps current={bookingStep(mode, 'confirmar')} steps={bookingSteps(mode)} />

        <div className="bc__card">
          <h1 className="bc__title">Confirmar reserva</h1>

          {/* Resumen del servicio */}
          <div className="bc__service-header">
            <div
              className="bc__service-img"
              style={{ backgroundImage: `url(${service.image})` }}
            />
            <div className="bc__service-info">
              <h2 className="bc__service-name">{service.name}</h2>
              <span className="bc__service-stars">{stars(service.rating)}</span>
              <p className="bc__service-address">
                <span className="bc__dot" /> {service.address}
              </p>
            </div>
          </div>

          <hr className="bc__divider" />

          {/* Tabla de detalles */}
          <div className="bc__details">
            {rows.map((r) => (
              <div key={r.label} className="bc__row">
                <span className="bc__label"><span className="bc__dot" /> {r.label}</span>
                <span className="bc__value">{r.value}</span>
              </div>
            ))}
          </div>

          <hr className="bc__divider" />

          {/* Total */}
          <div className="bc__total-row">
            <span className="bc__total-label">
              Total
              <span className="bc__total-note">
                ${service.price} {priceNote(mode)}
                {mode === 'dia' && ` × ${nights} ${nights === 1 ? 'noche' : 'noches'}`}
                {(mode === 'cupo' || mode === 'mesa' || mode === 'evento') && ` × ${people}`}
              </span>
            </span>
            <span className="bc__total-value">${total}</span>
          </div>

          {/* Botón pagar */}
          <button className="bc__pay-btn" onClick={handlePay}>Pagar</button>
        </div>
      </main>

      <footer className="bc__footer">reservvap.com/reservar/confirmar</footer>
    </div>
  );
}
