import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { stats } from '../data/dashboardData';
import { calendarEvents, calendarHours } from '../data/adminData';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { belongsToBusiness } from '../data/businesses';
import { payStatusLabel } from '../data/payments';
import { todayISO } from '../utils/datetime';
import '../styles/variables.css';
import './AdminDashboard.css';

const statusLabel = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' } as const;

// Pantalla 12/20 — Panel Administrador (Dashboard)
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { reservations, acceptReservation, cancelReservation } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;
  const bizName = user?.name;

  // Solo las reservas de ESTE negocio (incluye sus cuartos de hotel).
  const mine = reservations.filter((r) => belongsToBusiness(r.serviceId, bizId));
  // Lo que hay que atender: las pendientes y las que aún no ocurren.
  // El historial completo se consulta en Reportes.
  const hoy = todayISO();
  const active = mine
    .filter((r) => r.status !== 'cancelada' && (r.status === 'pendiente' || r.date >= hoy))
    .sort((a, b) => (a.status === 'pendiente' ? -1 : 1) - (b.status === 'pendiente' ? -1 : 1));
  const pendingCount = mine.filter((r) => r.status === 'pendiente').length;

  // Barras por hora calculadas con los eventos de este negocio.
  const myEvents = calendarEvents.filter((e) => !bizName || e.service === bizName);
  const maxPerHour = Math.max(1, ...calendarHours.map((h) => myEvents.filter((e) => e.hour === h).length));
  const bars = calendarHours
    .filter((h) => h <= 18)
    .map((h) => {
      const count = myEvents.filter((e) => e.hour === h).length;
      return { hour: String(h), value: count === 0 ? 6 : (count / maxPerHour) * 100 };
    });

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Dashboard</h1>
        <div className="ad__header-actions">
          <button className="ad__btn ad__btn--ghost">Hoy ▾</button>
          <button className="ad__btn" onClick={() => navigate('/admin/reportes')}>
            📊 Ver reportes
          </button>
        </div>
      </header>

      {/* Tarjetas de estadísticas */}
      <section className="ad__stats">
        {stats.map((s) => (
          <div key={s.label} className="ad__stat">
            <span className="ad__stat-label">{s.label}</span>
            <span className="ad__stat-value">{s.value}</span>
            <span className="ad__stat-delta">{s.delta}</span>
          </div>
        ))}
      </section>

      {/* Gráfico de barras */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">Reservas por hora — Hoy</h2>
          <button className="ad__panel-action">Vista mensual ▾</button>
        </div>
        <div className="ad__chart">
          {bars.map((b) => (
            <div key={b.hour} className="ad__bar-col">
              <div className="ad__bar" style={{ height: `${b.value}%` }} />
              <span className="ad__bar-label">{b.hour}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Reservas por atender / próximas */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">
            Reservas {pendingCount > 0 && <span className="ad__pending-pill">{pendingCount} por aceptar</span>}
          </h2>
        </div>

        {active.length === 0 ? (
          <p className="ad__empty">No hay reservas activas.</p>
        ) : (
          <div className="ad__res-list">
            {active.map((r) => (
              <div key={r.id} className="ad__res">
                <div className="ad__res-when">
                  <span className="ad__res-time">{r.time}</span>
                  <span className="ad__res-date">{r.dateLabel}</span>
                </div>
                <div className="ad__res-info">
                  <span className="ad__res-client">{r.customerName}</span>
                  <span className="ad__res-service">{r.serviceName}</span>
                  {/* Detalle según el tipo de reserva del negocio */}
                  <span className="ad__res-extra">
                    {r.mode === 'dia' && `Check-out ${r.checkOutLabel ?? '—'} · ${r.nights ?? 1} ${(r.nights ?? 1) === 1 ? 'noche' : 'noches'} · ${r.people ?? 1} pers.`}
                    {r.mode === 'mesa' && `${r.tableLabel ?? 'Mesa por asignar'} · ${r.people ?? 1} pers.`}
                    {r.mode === 'cupo' && `${r.people ?? 1} ${(r.people ?? 1) === 1 ? 'lugar' : 'lugares'}`}
                    {r.mode === 'evento' && `Salón completo · ${r.people ?? 1} invitados`}
                  </span>
                  {/* Cobro: quien paga en el lugar queda pendiente */}
                  {r.payStatus && (
                    <span className={`ad__res-pay ad__res-pay--${r.payStatus}`}>
                      {payStatusLabel[r.payStatus]}{r.total ? ` · $${r.total}` : ''}
                    </span>
                  )}
                </div>
                <span className={`ad__res-badge ad__res-badge--${r.status}`}>
                  {statusLabel[r.status]}
                </span>
                <div className="ad__res-actions">
                  {r.status === 'pendiente' && (
                    <button className="ad__res-accept" onClick={() => acceptReservation(r.id)}>
                      Aceptar
                    </button>
                  )}
                  <button className="ad__res-reject" onClick={() => cancelReservation(r.id)}>
                    {r.status === 'pendiente' ? 'Rechazar' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="ad__footer">Panel Administrador · 12/20</footer>
    </AdminLayout>
  );
}
