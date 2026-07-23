import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
import { serviceDetails } from '../data/serviceDetailData';
import { businessIdForService } from '../data/businesses';
import { bookingSteps, bookingStep } from '../data/bookingModes';
import { useStore } from '../store/StoreContext';
import { formatDateLabel, nightsBetween, todayISO } from '../utils/datetime';
import '../styles/variables.css';
import './DateSelect.css';

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  // Ajustar: JS usa 0=domingo, nosotros queremos 0=lunes
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Pantalla 6/20 — Selección de Fecha
// Se adapta al tipo de reserva del negocio: cita por hora, estancia por día
// (check-in / check-out), cupo por horario o mesa para X personas.
export default function DateSelect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getServiceBooking, getRoomsAvailable, getTables } = useStore();

  const service = id ? serviceDetails[id] : undefined;
  const cfg = getServiceBooking(id ?? '');
  const mode = cfg.mode;
  const isStay = mode === 'dia';
  const needsPeople = mode === 'mesa' || mode === 'cupo' || mode === 'evento';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [checkIn, setCheckIn] = useState<string | null>(null);   // ISO
  const [checkOut, setCheckOut] = useState<string | null>(null); // ISO (solo 'dia')
  const [people, setPeople] = useState(mode === 'mesa' ? 2 : mode === 'evento' ? 50 : 1);
  const [error, setError] = useState<string | null>(null);

  const cells = getCalendarDays(year, month);
  const todayStr = todayISO();

  // Máximo de personas: la mesa más grande del restaurante o el tope del negocio.
  const tables = getTables(businessIdForService(id ?? ''));
  const maxTableSeats = tables.reduce((m, t) => Math.max(m, t.seats), 0);
  const maxPeople = mode === 'mesa'
    ? (maxTableSeats || cfg.maxPeople)
    : cfg.maxPeople;
  // En los eventos los invitados se cuentan de 10 en 10 (listas grandes).
  const step = mode === 'evento' ? 10 : 1;

  const isoOf = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const isPast = (day: number) => isoOf(day) < todayStr;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Un clic elige la fecha. En modo estancia, el primero es la entrada y el
  // segundo la salida (si es anterior, se reinicia el rango).
  const pickDay = (day: number) => {
    const iso = isoOf(day);
    setError(null);
    if (!isStay) { setCheckIn(iso); return; }
    if (!checkIn || checkOut || iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    setCheckOut(iso);
  };

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const roomsLeft = isStay && checkIn && checkOut
    ? getRoomsAvailable(id ?? '', checkIn, checkOut)
    : 0;

  const inRange = (iso: string) =>
    isStay && checkIn !== null && checkOut !== null && iso > checkIn && iso < checkOut;

  const canContinue = isStay ? !!(checkIn && checkOut) : !!checkIn;

  const handleContinue = () => {
    if (!checkIn) return;
    if (isStay) {
      if (!checkOut) { setError('Elige también la fecha de salida.'); return; }
      if (nights < cfg.minNights) {
        setError(`La estancia mínima es de ${cfg.minNights} ${cfg.minNights === 1 ? 'noche' : 'noches'}.`);
        return;
      }
      if (roomsLeft <= 0) {
        setError('No quedan habitaciones de este tipo en esas fechas. Prueba con otras.');
        return;
      }
      navigate(`/reservar/${id}/confirmar`, {
        state: { date: checkIn, checkOut, people, time: cfg.checkInTime },
      });
      return;
    }
    navigate(`/reservar/${id}/horario`, { state: { date: checkIn, people } });
  };

  const title = isStay
    ? 'Elegir fechas de tu estancia'
    : mode === 'evento' ? 'Elegir la fecha de tu evento' : 'Elegir fecha';

  return (
    <div className="ds">
      <Navbar active="Reservas" />

      <main className="ds__container">
        <BookingSteps current={bookingStep(mode, 'fecha')} steps={bookingSteps(mode)} />

        <div className="ds__card">
          <h1 className="ds__title">{title}</h1>
          {service && <p className="ds__subtitle">{service.name}</p>}

          {isStay && (
            <p className="ds__hint">
              Toca el día de <strong>entrada</strong> y luego el de <strong>salida</strong>.
              Check-in {cfg.checkInTime} · Check-out {cfg.checkOutTime}.
            </p>
          )}

          {/* Navegación de mes */}
          <div className="ds__month-nav">
            <button className="ds__month-btn" onClick={prevMonth} aria-label="Mes anterior">◀</button>
            <span className="ds__month-label">{MONTH_NAMES[month]} {year}</span>
            <button className="ds__month-btn" onClick={nextMonth} aria-label="Mes siguiente">▶</button>
          </div>

          {/* Encabezados de día */}
          <div className="ds__grid ds__grid--header">
            {DAY_NAMES.map((d, i) => (
              <span key={i} className="ds__day-name">{d}</span>
            ))}
          </div>

          {/* Celdas del calendario */}
          <div className="ds__grid">
            {cells.map((day, i) => {
              if (day === null) return <button key={i} className="ds__cell is-empty" disabled />;
              const iso = isoOf(day);
              const past = isPast(day);
              const isIn = iso === checkIn;
              const isOut = iso === checkOut;
              return (
                <button
                  key={i}
                  className={[
                    'ds__cell',
                    isIn || isOut ? 'is-selected' : '',
                    inRange(iso) ? 'is-in-range' : '',
                    past ? 'is-past' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={past}
                  onClick={() => pickDay(day)}
                >
                  {day}
                  {isStay && isIn && <span className="ds__cell-tag">Entrada</span>}
                  {isStay && isOut && <span className="ds__cell-tag">Salida</span>}
                </button>
              );
            })}
          </div>

          {/* Resumen de la fecha / estancia elegida */}
          {isStay ? (
            checkIn && (
              <div className="ds__selected-bar">
                <span className="ds__selected-dot" />
                Entrada: {formatDateLabel(checkIn)}
                {checkOut
                  ? ` · Salida: ${formatDateLabel(checkOut)} · ${nights} ${nights === 1 ? 'noche' : 'noches'}`
                  : ' · Elige la fecha de salida'}
                {checkOut && (
                  <button className="ds__clear" onClick={() => { setCheckOut(null); setError(null); }}>
                    Cambiar
                  </button>
                )}
              </div>
            )
          ) : (
            checkIn && (
              <div className="ds__selected-bar">
                <span className="ds__selected-dot" />
                Fecha seleccionada: {formatDateLabel(checkIn)}
              </div>
            )
          )}

          {/* Nº de personas (mesa, cupo y evento) */}
          {needsPeople && (
            <div className="ds__people">
              <span className="ds__people-label">
                {mode === 'mesa' ? '¿Para cuántas personas es la mesa?'
                  : mode === 'evento' ? '¿Cuántos invitados asistirán?'
                    : '¿Cuántos lugares apartas?'}
              </span>
              <div className="ds__stepper">
                <button
                  type="button"
                  className="ds__step"
                  onClick={() => setPeople((p) => Math.max(1, p - step))}
                  aria-label="Menos personas"
                >−</button>
                <span className="ds__step-value">{people}</span>
                <button
                  type="button"
                  className="ds__step"
                  onClick={() => setPeople((p) => Math.min(maxPeople, p + step))}
                  aria-label="Más personas"
                >+</button>
              </div>
              <span className="ds__people-max">Máximo {maxPeople}</span>
            </div>
          )}

          {/* Precio estimado del evento */}
          {mode === 'evento' && service && (
            <div className="ds__total">
              <span>{people} invitados × ${service.price}</span>
              <strong>${service.price * people}</strong>
            </div>
          )}

          {/* Precio estimado de la estancia */}
          {isStay && service && nights > 0 && (
            <div className="ds__total">
              <span>{nights} {nights === 1 ? 'noche' : 'noches'} × ${service.price}</span>
              <strong>${service.price * nights}</strong>
            </div>
          )}
          {isStay && checkIn && checkOut && roomsLeft > 0 && (
            <p className="ds__avail">
              {roomsLeft} {roomsLeft === 1 ? 'habitación disponible' : 'habitaciones disponibles'} en esas fechas
            </p>
          )}

          {error && <p className="ds__error">{error}</p>}

          {/* Botón continuar */}
          <button
            className="ds__continue-btn"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {isStay ? 'Continuar a confirmar' : 'Continuar'}
          </button>
        </div>
      </main>

      <footer className="ds__footer">reservvap.com/reservar/fecha</footer>
    </div>
  );
}
