import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import { useStore } from '../store/StoreContext';
import { formatDateLabel as formatDate, nightsBetween } from '../utils/datetime';
import '../styles/variables.css';
import './BookingSuccess.css';

// Pantalla 10/20 — Reserva Exitosa
export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    { date?: string; time?: string; checkOut?: string; people?: number } | null;
  const { getServiceBooking, reservations } = useStore();

  const mode = getServiceBooking(id ?? '').mode;
  const date = state?.date ?? '';
  const checkOut = state?.checkOut ?? '';
  const people = state?.people ?? 1;
  const time = state?.time ?? '';
  const nights = mode === 'dia' ? nightsBetween(date, checkOut) : 0;
  const service = id ? serviceDetails[id] : undefined;

  // Mesa que acaba de asignar el sistema (la reserva más reciente del servicio).
  const justBooked = reservations.find((r) => r.serviceId === id && r.date === date && r.time === time);

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
          {mode === 'dia' && ' Presenta tu identificación al hacer el check-in.'}
          {mode === 'evento' && ' El salón se comunicará contigo para afinar el montaje y el menú.'}
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
              {mode === 'dia' ? (
                <>
                  <p className="su__card-line">
                    <span className="su__dot" /> Check-in: {date ? formatDate(date) : '—'} · {time || '—'}
                  </p>
                  <p className="su__card-line">
                    <span className="su__dot" /> Check-out: {checkOut ? formatDate(checkOut) : '—'}
                    {' · '}{nights} {nights === 1 ? 'noche' : 'noches'}
                  </p>
                </>
              ) : (
                <p className="su__card-line">
                  <span className="su__dot" /> {date ? formatDate(date) : '—'} · {time || '—'}
                </p>
              )}
              {mode === 'mesa' && (
                <p className="su__card-line">
                  <span className="su__dot" /> {justBooked?.tableLabel ?? 'Mesa asignada'} · {people} {people === 1 ? 'persona' : 'personas'}
                </p>
              )}
              {mode === 'cupo' && (
                <p className="su__card-line">
                  <span className="su__dot" /> {people} {people === 1 ? 'lugar apartado' : 'lugares apartados'}
                </p>
              )}
              {mode === 'evento' && (
                <p className="su__card-line">
                  <span className="su__dot" /> Salón completo · {people} {people === 1 ? 'invitado' : 'invitados'}
                </p>
              )}
              <p className="su__card-line">
                <span className="su__dot" /> {service.address}
              </p>
              {/* Quien eligió pagar en el lugar liquida al llegar */}
              {justBooked?.payStatus === 'pendiente' && (
                <p className="su__card-line">
                  <span className="su__dot" /> Pago pendiente: ${justBooked.total ?? service.price} en el lugar
                </p>
              )}
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
