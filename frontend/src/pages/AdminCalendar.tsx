import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { weekDays, calendarHours, calendarEvents, serviceLegend } from '../data/adminData';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminCalendar.css';

const MINI_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
// Julio 2026 empieza en miércoles → 2 huecos antes del día 1
const miniCells: (number | null)[] = [null, null, ...Array.from({ length: 31 }, (_, i) => i + 1)];

// Pantalla 16/20 — Calendario (Panel Administrador)
export default function AdminCalendar() {
  const [view, setView] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const { user } = useAuth();
  const bizName = user?.name;

  // Solo los eventos y la leyenda de ESTE negocio.
  const events = calendarEvents.filter((e) => !bizName || e.service === bizName);
  const legend = bizName ? serviceLegend.filter((s) => s.name === bizName) : serviceLegend;

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Calendario</h1>
        <div className="ac__actions">
          <div className="ac__views">
            {(['Día', 'Semana', 'Mes'] as const).map((v) => (
              <button
                key={v}
                className={`ac__view ${view === v ? 'is-active' : ''}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="ad__btn">+ Nueva reserva</button>
        </div>
      </header>

      <div className="ac__layout">
        {/* Columna izquierda: mini calendario + filtros */}
        <aside className="ac__side">
          <div className="ac__panel">
            <div className="ac__mini-head">
              <button className="ac__mini-nav">‹</button>
              <span className="ac__mini-title">Julio 2026</span>
              <button className="ac__mini-nav">›</button>
            </div>
            <div className="ac__mini-grid ac__mini-grid--head">
              {MINI_DAYS.map((d, i) => <span key={i} className="ac__mini-dayname">{d}</span>)}
            </div>
            <div className="ac__mini-grid">
              {miniCells.map((d, i) => (
                <span key={i} className={`ac__mini-cell ${d === 20 ? 'is-today' : ''} ${d === null ? 'is-empty' : ''}`}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="ac__panel">
            <h3 className="ac__panel-title">Filtrar por servicio</h3>
            {legend.map((s) => (
              <label key={s.name} className="ac__legend">
                <span className="ac__legend-dot" style={{ background: s.color }} />
                {s.name}
              </label>
            ))}
          </div>

          <div className="ac__panel">
            <h3 className="ac__panel-title">Estado</h3>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-green)' }} /> Confirmada</label>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-amber)' }} /> Pendiente</label>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-red)' }} /> Cancelada</label>
          </div>
        </aside>

        {/* Rejilla de la semana */}
        <div className="ac__grid-wrap">
          <div className="ac__grid">
            {/* Encabezado de días */}
            <div className="ac__cell ac__cell--corner" />
            {weekDays.map((d) => (
              <div key={d.name} className="ac__cell ac__col-head">
                <span className="ac__col-day">{d.name}</span>
                <span className="ac__col-date">{d.date}</span>
              </div>
            ))}

            {/* Filas por hora */}
            {calendarHours.map((h) => (
              <div key={h} className="ac__row" style={{ display: 'contents' }}>
                <div className="ac__cell ac__hour">{h}:00</div>
                {weekDays.map((_, dayIdx) => {
                  const ev = events.find((e) => e.hour === h && e.day === dayIdx);
                  return (
                    <div key={dayIdx} className="ac__cell ac__slot">
                      {ev && (
                        <div className={`ac__event ac__event--${ev.status}`}>
                          <span className="ac__event-client">{ev.client}</span>
                          <span className="ac__event-service">{ev.service}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="ad__footer">Calendario · 16/20</footer>
    </AdminLayout>
  );
}
