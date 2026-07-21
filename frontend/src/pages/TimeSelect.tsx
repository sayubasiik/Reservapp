import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingSteps from '../components/BookingSteps';
import { serviceDetails } from '../data/serviceDetailData';
import { TIME_SLOTS } from '../data/slots';
import { useStore } from '../store/StoreContext';
import '../styles/variables.css';
import './TimeSelect.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Pantalla 7/20 — Selección de Horario
export default function TimeSelect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string } | null;
  const date = state?.date ?? '';
  const service = id ? serviceDetails[id] : undefined;
  const { getAvailable } = useStore();

  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selected) {
      navigate(`/reservar/${id}/confirmar`, {
        state: { date, time: selected },
      });
    }
  };

  return (
    <div className="ts">
      <Navbar active="Reservas" />

      <main className="ts__container">
        <BookingSteps current={3} />

        <div className="ts__card">
          <h1 className="ts__title">Selecciona un horario</h1>
          <p className="ts__subtitle">
            {service?.name ?? 'Servicio'} — {date ? formatDate(date) : ''}
          </p>

          {/* Grid de horarios (los espacios disponibles vienen del negocio) */}
          <div className="ts__grid">
            {TIME_SLOTS.map((slot) => {
              const available = id && date ? getAvailable(id, date, slot) : 0;
              const occupied = available <= 0;
              return (
                <button
                  key={slot}
                  className={`ts__slot ${selected === slot ? 'is-selected' : ''} ${occupied ? 'is-occupied' : ''}`}
                  disabled={occupied}
                  onClick={() => !occupied && setSelected(slot)}
                >
                  <span className="ts__slot-time">{slot}</span>
                  <span className="ts__slot-tag">
                    {occupied ? 'Ocupado' : `${available} ${available === 1 ? 'lugar' : 'lugares'}`}
                  </span>
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
            Confirmar horario
          </button>
        </div>
      </main>

      <footer className="ts__footer">reservvap.com/reservar/horario</footer>
    </div>
  );
}
