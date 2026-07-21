import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import type { ResStatus } from '../store/StoreContext';
import '../styles/variables.css';
import './MyReservations.css';

const TABS: { key: 'proximas' | 'canceladas'; label: string }[] = [
  { key: 'proximas',   label: 'Próximas' },
  { key: 'canceladas', label: 'Canceladas' },
];

const statusLabel: Record<ResStatus, string> = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
};

// Pantalla 11/20 — Mis Reservas
export default function MyReservations() {
  const { reservations, cancelReservation } = useStore();
  const { user } = useAuth();
  const [tab, setTab] = useState<'proximas' | 'canceladas'>('proximas');

  // Solo las reservas del usuario en sesión.
  const mine = reservations.filter((r) => r.customerName === (user?.name ?? 'Cliente'));
  const list = tab === 'proximas'
    ? mine.filter((r) => r.status !== 'cancelada')
    : mine.filter((r) => r.status === 'cancelada');

  return (
    <div className="mr">
      <Navbar active="Reservas" />

      <main className="mr__container">
        <h1 className="mr__title">Mis Reservas</h1>

        {/* Pestañas */}
        <div className="mr__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`mr__tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de reservas */}
        {list.length === 0 ? (
          <p className="mr__empty">No hay reservas en esta sección.</p>
        ) : (
          <div className="mr__list">
            {list.map((r) => (
              <article key={r.id} className="mr__item">
                <div
                  className="mr__item-img"
                  style={{ backgroundImage: `url(${r.image})` }}
                />
                <div className="mr__item-body">
                  <h2 className="mr__item-name">{r.serviceName}</h2>
                  <p className="mr__item-line">
                    <span className="mr__dot" /> {r.dateLabel} · {r.time}
                  </p>
                  <p className="mr__item-line">
                    <span className="mr__dot" /> {r.address}
                  </p>
                  {r.status !== 'cancelada' && (
                    <div className="mr__item-actions">
                      <a href="#" className="mr__action" onClick={(e) => e.preventDefault()}>Modificar</a>
                      <span className="mr__action-sep">·</span>
                      <a
                        href="#"
                        className="mr__action mr__action--danger"
                        onClick={(e) => { e.preventDefault(); cancelReservation(r.id); }}
                      >
                        Cancelar
                      </a>
                    </div>
                  )}
                </div>
                <span className={`mr__badge mr__badge--${r.status}`}>
                  {statusLabel[r.status]}
                </span>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="mr__footer">reservvap.com/mis-reservas</footer>
    </div>
  );
}
