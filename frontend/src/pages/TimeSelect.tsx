import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
import { serviceDetails } from '../data/serviceDetailData';
import { TIME_SLOTS } from '../data/slots';
import { bookingSteps, bookingStep } from '../data/bookingModes';
import { useStore } from '../store/StoreContext';
import { formatDateLabel, slotHasPassed } from '../utils/datetime';
import '../styles/variables.css';
import './TimeSelect.css';

// Pantalla 7/20 — Selección de Horario
// El significado de "disponible" cambia según el tipo de reserva del negocio:
// citas por hora (espacios), clases por cupo (lugares) o mesas (nº de mesas libres).
export default function TimeSelect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string; people?: number } | null;
  const date = state?.date ?? '';
  const people = state?.people ?? 1;
  const service = id ? serviceDetails[id] : undefined;
  const { getAvailable, getFreeTables, getServiceBooking } = useStore();

  const mode = getServiceBooking(id ?? '').mode;
  const [selected, setSelected] = useState<string | null>(null);

  // Espacios libres del horario según el tipo de reserva.
  const freeAt = (slot: string): number => {
    if (!id || !date) return 0;
    if (mode === 'mesa') return getFreeTables(id, date, slot, people).length;
    return getAvailable(id, date, slot);
  };

  // Cuántos espacios necesita esta reserva.
  const needed = mode === 'cupo' ? people : 1;

  const tagFor = (free: number, passed: boolean) => {
    if (passed) return 'Ya pasó';
    if (free < needed) return mode === 'mesa' ? 'Sin mesas' : 'Ocupado';
    if (mode === 'mesa') return `${free} ${free === 1 ? 'mesa' : 'mesas'}`;
    if (mode === 'evento') return 'Turno libre';
    return `${free} ${free === 1 ? 'lugar' : 'lugares'}`;
  };

  const subtitle = [
    service?.name ?? 'Servicio',
    date ? formatDateLabel(date) : '',
    mode === 'mesa' ? `mesa para ${people} ${people === 1 ? 'persona' : 'personas'}` : '',
    mode === 'cupo' ? `${people} ${people === 1 ? 'lugar' : 'lugares'}` : '',
    mode === 'evento' ? `${people} ${people === 1 ? 'invitado' : 'invitados'}` : '',
  ].filter(Boolean).join(' — ');

  const handleConfirm = () => {
    if (selected) {
      navigate(`/reservar/${id}/confirmar`, {
        state: { date, time: selected, people },
      });
    }
  };

  return (
    <div className="ts">
      <Navbar active="Reservas" />

      <main className="ts__container">
        <BookingSteps current={bookingStep(mode, 'horario')} steps={bookingSteps(mode)} />

        <div className="ts__card">
          <h1 className="ts__title">
            {mode === 'evento' ? 'Selecciona el turno de tu evento' : 'Selecciona un horario'}
          </h1>
          <p className="ts__subtitle">{subtitle}</p>

          {/* Grid de horarios (los espacios disponibles vienen del negocio) */}
          <div className="ts__grid">
            {TIME_SLOTS.map((slot) => {
              const passed = slotHasPassed(date, slot);
              const free = freeAt(slot);
              const disabled = passed || free < needed;
              return (
                <button
                  key={slot}
                  className={`ts__slot ${selected === slot ? 'is-selected' : ''} ${disabled ? 'is-occupied' : ''}`}
                  disabled={disabled}
                  onClick={() => !disabled && setSelected(slot)}
                >
                  <span className="ts__slot-time">{slot}</span>
                  <span className="ts__slot-tag">{tagFor(free, passed)}</span>
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="ts__legend">
            <span className="ts__legend-item"><span className="ts__legend-dot ts__legend-dot--free" /> Disponible</span>
            <span className="ts__legend-item"><span className="ts__legend-dot ts__legend-dot--busy" /> Ocupado</span>
          </div>

          {/* Botón confirmar */}
          <button
            className="ts__confirm-btn"
            disabled={!selected}
            onClick={handleConfirm}
          >
            {mode === 'evento' ? 'Confirmar turno' : 'Confirmar horario'}
          </button>
        </div>
      </main>

      <footer className="ts__footer">reservapp.com/reservar/horario</footer>
    </div>
  );
}
