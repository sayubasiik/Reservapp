import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
import { serviceDetails } from '../data/serviceDetailData';
import '../styles/variables.css';
import './BookingConfirm.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Barberos ficticios por servicio
const barbers: Record<string, string> = {
  'barberia-elite': 'Carlos Mendoza',
  'spa-relax': 'Andrea López',
  'clinica-dental': 'Dr. Ramírez',
  'yoga-studio': 'Fernanda Torres',
};

// Pantalla 8/12 — Confirmación de Reserva
export default function BookingConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string; time?: string } | null;
  const date = state?.date ?? '';
  const time = state?.time ?? '';
  const service = id ? serviceDetails[id] : undefined;

  if (!service) {
    return (
      <div className="bc">
        <Navbar active="Reservas" />
        <main className="bc__container"><p>Servicio no encontrado.</p></main>
      </div>
    );
  }

  const stars = (rating: number) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const handlePay = () => {
    navigate(`/reservar/${id}/pago`, { state: { date, time } });
  };

  return (
    <div className="bc">
      <Navbar active="Reservas" />

      <main className="bc__container">
        <BookingSteps current={4} />

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
            <div className="bc__row">
              <span className="bc__label"><span className="bc__dot" /> Servicio</span>
              <span className="bc__value">{service.name} — Corte profesional</span>
            </div>
            <div className="bc__row">
              <span className="bc__label"><span className="bc__dot" /> Fecha</span>
              <span className="bc__value">{date ? formatDate(date) : '—'}</span>
            </div>
            <div className="bc__row">
              <span className="bc__label"><span className="bc__dot" /> Hora</span>
              <span className="bc__value">{time || '—'}</span>
            </div>
            <div className="bc__row">
              <span className="bc__label"><span className="bc__dot" /> Duración</span>
              <span className="bc__value">{service.duration.replace('min', 'minutos')}</span>
            </div>
            <div className="bc__row">
              <span className="bc__label"><span className="bc__dot" /> Barbero</span>
              <span className="bc__value">{barbers[service.id] ?? 'Por asignar'}</span>
            </div>
          </div>

          <hr className="bc__divider" />

          {/* Total */}
          <div className="bc__total-row">
            <span className="bc__total-label">Total</span>
            <span className="bc__total-value">${service.price}</span>
          </div>

          {/* Botón pagar */}
          <button className="bc__pay-btn" onClick={handlePay}>Pagar</button>
        </div>
      </main>

      <footer className="bc__footer">reservvap.com/reservar/confirmar</footer>
    </div>
  );
}
