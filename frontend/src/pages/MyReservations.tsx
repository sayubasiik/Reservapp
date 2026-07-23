import { useState } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import type { ResStatus, Reservation } from '../store/StoreContext';
import { TIME_SLOTS } from '../data/slots';
import { payStatusLabel, payMethodShort } from '../data/payments';
import { formatDateLabel, todayISO, slotHasPassed, nightsBetween, nextDayISO } from '../utils/datetime';
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
  const { reservations, cancelReservation, reschedule, getServiceBooking } = useStore();
  const { user } = useAuth();
  const [tab, setTab] = useState<'proximas' | 'canceladas'>('proximas');

  // Reserva que se está modificando (null = modal cerrado).
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newOut, setNewOut] = useState('');   // solo reservas por día
  const [newTime, setNewTime] = useState('');
  const [newPeople, setNewPeople] = useState(1);
  const [editError, setEditError] = useState<string | null>(null);

  // Tipo de reserva: el guardado o, si es antigua, el del negocio.
  const modeOf = (r: Reservation) => r.mode ?? getServiceBooking(r.serviceId).mode;
  const editMode = editing ? modeOf(editing) : 'hora';

  const openEdit = (r: Reservation) => {
    setEditing(r);
    setNewDate(r.date);
    setNewOut(r.checkOut ?? nextDayISO(r.date));
    setNewTime(r.time);
    setNewPeople(r.people ?? 1);
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!newDate) { setEditError('Elige una fecha.'); return; }
    if (newDate < todayISO()) { setEditError('No puedes elegir una fecha pasada.'); return; }

    // Reservas por día: se cambia el rango de la estancia, no el horario.
    if (editMode === 'dia') {
      if (!newOut || newOut <= newDate) { setEditError('La salida debe ser después de la entrada.'); return; }
      const ok = reschedule(editing.id, newDate, formatDateLabel(newDate), editing.time, {
        checkOut: newOut,
        checkOutLabel: formatDateLabel(newOut),
        people: newPeople,
      });
      if (!ok) { setEditError('No hay habitaciones libres en esas fechas. Elige otras.'); return; }
      setEditing(null);
      return;
    }

    if (!newTime) { setEditError('Elige un horario.'); return; }
    if (slotHasPassed(newDate, newTime)) { setEditError('Ese horario ya pasó para hoy.'); return; }
    const ok = reschedule(editing.id, newDate, formatDateLabel(newDate), newTime, { people: newPeople });
    if (!ok) {
      setEditError(editMode === 'mesa'
        ? 'No hay mesas libres para esas personas en ese horario. Elige otro.'
        : editMode === 'evento'
          ? 'Ese turno ya está apartado por otro evento. Elige otro.'
          : 'Ese horario ya está lleno. Elige otro.');
      return;
    }
    setEditing(null);
  };

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
                  {modeOf(r) === 'dia' ? (
                    <>
                      <p className="mr__item-line">
                        <span className="mr__dot" /> Check-in {r.dateLabel} · {r.time}
                      </p>
                      <p className="mr__item-line">
                        <span className="mr__dot" /> Check-out {r.checkOutLabel ?? '—'} · {r.checkOutTime ?? ''}
                        {r.nights ? ` · ${r.nights} ${r.nights === 1 ? 'noche' : 'noches'}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="mr__item-line">
                      <span className="mr__dot" /> {r.dateLabel} · {r.time}
                    </p>
                  )}
                  {modeOf(r) === 'mesa' && (
                    <p className="mr__item-line">
                      <span className="mr__dot" /> {r.tableLabel ?? 'Mesa por asignar'} · {r.people ?? 1} {(r.people ?? 1) === 1 ? 'persona' : 'personas'}
                    </p>
                  )}
                  {modeOf(r) === 'cupo' && (
                    <p className="mr__item-line">
                      <span className="mr__dot" /> {r.people ?? 1} {(r.people ?? 1) === 1 ? 'lugar' : 'lugares'}
                    </p>
                  )}
                  {modeOf(r) === 'evento' && (
                    <p className="mr__item-line">
                      <span className="mr__dot" /> Salón completo · {r.people ?? 1} {(r.people ?? 1) === 1 ? 'invitado' : 'invitados'}
                    </p>
                  )}
                  <p className="mr__item-line">
                    <span className="mr__dot" /> {r.address}
                  </p>
                  {/* Estado del pago (pendiente = se paga en el lugar) */}
                  {r.payStatus && (
                    <p className="mr__item-line">
                      <span className="mr__dot" /> {payStatusLabel[r.payStatus]}
                      {r.total ? ` · $${r.total}` : ''}
                      {r.payMethod ? ` · ${payMethodShort[r.payMethod]}` : ''}
                    </p>
                  )}
                  {r.status !== 'cancelada' && (
                    <div className="mr__item-actions">
                      <a
                        href="#"
                        className="mr__action"
                        onClick={(e) => { e.preventDefault(); openEdit(r); }}
                      >
                        Modificar
                      </a>
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

      {/* Modal de modificar / reagendar */}
      <Modal
        open={!!editing}
        title="Modificar reserva"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <>
            <p className="mr__edit-service">{editing.serviceName}</p>

            <div className="rv-form-field">
              <span className="rv-form-label">
                {editMode === 'dia' ? 'Nueva fecha de entrada' : 'Nueva fecha'}
              </span>
              <input
                type="date"
                className="rv-form-input"
                min={todayISO()}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            {editMode === 'dia' ? (
              <>
                <div className="rv-form-field">
                  <span className="rv-form-label">Nueva fecha de salida</span>
                  <input
                    type="date"
                    className="rv-form-input"
                    min={nextDayISO(newDate || todayISO())}
                    value={newOut}
                    onChange={(e) => setNewOut(e.target.value)}
                  />
                </div>
                <p className="mr__edit-nights">
                  {nightsBetween(newDate, newOut)} {nightsBetween(newDate, newOut) === 1 ? 'noche' : 'noches'}
                </p>
              </>
            ) : (
              <div className="rv-form-field">
                <span className="rv-form-label">
                  {editMode === 'evento' ? 'Nuevo turno' : 'Nuevo horario'}
                </span>
                <div className="mr__slot-grid">
                  {TIME_SLOTS.map((slot) => {
                    const passed = slotHasPassed(newDate, slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`mr__slot ${newTime === slot ? 'is-selected' : ''}`}
                        disabled={passed}
                        onClick={() => setNewTime(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {editMode !== 'hora' && (
              <div className="rv-form-field">
                <span className="rv-form-label">
                  {editMode === 'mesa' ? 'Personas en la mesa'
                    : editMode === 'dia' ? 'Huéspedes'
                      : editMode === 'evento' ? 'Invitados' : 'Lugares'}
                </span>
                <div className="mr__people">
                  <button type="button" className="mr__people-btn"
                    onClick={() => setNewPeople((p) => Math.max(1, p - 1))}>−</button>
                  <span className="mr__people-value">{newPeople}</span>
                  <button type="button" className="mr__people-btn"
                    onClick={() => setNewPeople((p) => p + 1)}>+</button>
                </div>
              </div>
            )}

            {editError && <p className="rv-form-error">{editError}</p>}

            <div className="rv-form-actions">
              <button className="rv-btn rv-btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="rv-btn" onClick={saveEdit}>Guardar cambios</button>
            </div>
          </>
        )}
      </Modal>

      <footer className="mr__footer">reservvap.com/mis-reservas</footer>
    </div>
  );
}
