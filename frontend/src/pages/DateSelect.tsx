import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
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

// Pantalla 6/12 — Selección de Fecha
export default function DateSelect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const cells = getCalendarDays(year, month);

  // Medianoche de hoy (para comparar sin la parte de la hora)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // ¿La fecha de esta celda ya pasó? (se muestra tenue y no se puede elegir)
  const isPast = (day: number) => new Date(year, month, day) < todayMidnight;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const formattedDate = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[month]} ${year}`
    : null;

  const handleContinue = () => {
    if (selectedDay) {
      navigate(`/reservar/${id}/horario`, {
        state: { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` },
      });
    }
  };

  return (
    <div className="ds">
      <Navbar active="Reservas" />

      <main className="ds__container">
        <BookingSteps current={2} />

        <div className="ds__card">
          <h1 className="ds__title">Elegir fecha</h1>

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
              const past = day !== null && isPast(day);
              return (
                <button
                  key={i}
                  className={`ds__cell ${day === selectedDay ? 'is-selected' : ''} ${day === null ? 'is-empty' : ''} ${past ? 'is-past' : ''}`}
                  disabled={day === null || past}
                  onClick={() => day && !past && setSelectedDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Fecha seleccionada */}
          {formattedDate && (
            <div className="ds__selected-bar">
              <span className="ds__selected-dot" />
              Fecha seleccionada: {formattedDate}
            </div>
          )}

          {/* Botón continuar */}
          <button
            className="ds__continue-btn"
            disabled={!selectedDay}
            onClick={handleContinue}
          >
            Continuar
          </button>
        </div>
      </main>

      <footer className="ds__footer">reservvap.com/reservar/fecha</footer>
    </div>
  );
}
