import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import '../styles/variables.css';
import './BookingSuccess.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Pantalla 10/12 — Reserva Exitosa
export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string; time?: string } | null;
  const date = state?.date ?? '';
  const time = state?.time ?? '';
  const service = id ? serviceDetails[id] : undefined;

  return (
    <div className="su">
      <Navbar active="Reservas" />

      <main className="su__container">
        {/* Ícono de éxito */}
        <div className="su__check-wrap">
          <div className="su__check">✓</div>
        </div>

        <h1 className="su__title">¡Reserva confirmada!</h1>
        <p className="su__subtitle">
          Recibirás un correo de confirmación con los detalles.
        </p>

        {/* Tarjeta resumen */}
        {service && (
          <div className="su__card">
            <div
              className="su__card-img"
              style={{ backgroundImage: `url(${service.image})` }}
            />
            <div className="su__card-info">
              <h2 className="su__card-name">{service.name}</h2>
              <p className="su__card-line">
                <span className="su__dot" /> {date ? formatDate(date) : '—'} · {time || '—'}
              </p>
              <p className="su__card-line">
                <span className="su__dot" /> {service.address}
              </p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="su__actions">
          <button className="su__btn su__btn--primary" onClick={() => navigate('/mis-reservas')}>
            Ver mis reservas
          </button>
          <button className="su__btn su__btn--ghost" onClick={() => navigate('/')}>
            Ir al inicio
          </button>
        </div>
      </main>

      <footer className="su__footer">reservvap.com/reservar/exitosa</footer>
    </div>
  );
}
