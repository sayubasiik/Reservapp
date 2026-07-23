import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { calendarEvents, calendarHours } from '../data/adminData';
import { serviceDetails, servicesOfBusiness } from '../data/serviceDetailData';
import { TIME_SLOTS } from '../data/slots';
import { bookingModeLabel, bookingTotal } from '../data/bookingModes';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { belongsToBusiness } from '../data/businesses';
import {
  MONTH_NAMES, formatDateLabel, todayISO, slotToMinutes, slotHasPassed,
  nightsBetween, nextDayISO, addDaysISO,
} from '../utils/datetime';
import '../styles/variables.css';
import './AdminCalendar.css';

const MINI_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEK_DAYNAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Evento unificado (mock + reservas reales), siempre con fecha ISO.
interface CalEvent {
  dateISO: string;
  hour: number;
  client: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
  detail?: string;   // "4 pers.", "Mesa 3", "Noche 2/3"...
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseHour = (time: string) => Math.floor(slotToMinutes(time) / 60);

// Lunes de la semana que contiene la fecha dada.
function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  const m = new Date(d);
  m.setDate(d.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

function calendarCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

// Pantalla 16/20 — Calendario (Panel Administrador)
export default function AdminCalendar() {
  const { reservations, book, getBookingConfig } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;
  const bizName = user?.name;

  // Tipo de reservas del negocio: define qué pide el formulario de alta.
  const cfg = getBookingConfig(bizId, user?.businessType);
  const mode = cfg.mode;
  // Servicios reservables (el hotel tiene uno por tipo de habitación y el
  // salón de eventos uno por cada salón).
  const services = servicesOfBusiness(bizId);
  // En los eventos los invitados se cuentan de 10 en 10.
  const peopleStep = mode === 'evento' ? 10 : 1;

  const [view, setView] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [cursor, setCursor] = useState(() => new Date()); // fecha en foco
  const [miniMonth, setMiniMonth] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));

  // Modal nueva reserva
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({
    client: '',
    serviceId: '',
    date: todayISO(),
    checkOut: '',
    time: '',
    people: mode === 'mesa' ? 2 : mode === 'evento' ? 50 : 1,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // ---- Eventos del negocio (seed mock + reservas reales) ----
  const events = useMemo<CalEvent[]>(() => {
    // Los eventos mock se anclan a la semana del 20–26 de julio 2026 (Lun=20).
    const seeded: CalEvent[] = calendarEvents
      .filter((e) => !bizName || e.service === bizName)
      .map((e) => ({ dateISO: toISO(new Date(2026, 6, 20 + e.day)), hour: e.hour, client: e.client, status: e.status }));
    // Las estancias por día ocupan todas sus noches en el calendario.
    const real: CalEvent[] = reservations
      .filter((r) => belongsToBusiness(r.serviceId, bizId))
      .flatMap((r) => {
        const hour = parseHour(r.time);
        if (r.mode === 'dia' && r.checkOut) {
          const total = Math.max(1, r.nights ?? nightsBetween(r.date, r.checkOut));
          return Array.from({ length: total }, (_, i) => ({
            dateISO: addDaysISO(r.date, i),
            hour,
            client: r.customerName,
            status: r.status,
            detail: `Noche ${i + 1}/${total}`,
          }));
        }
        const detail = r.mode === 'mesa'
          ? `${r.tableLabel ?? 'Mesa'} · ${r.people ?? 1} pers.`
          : r.mode === 'cupo'
            ? `${r.people ?? 1} ${(r.people ?? 1) === 1 ? 'lugar' : 'lugares'}`
            : r.mode === 'evento'
              ? `Evento · ${r.people ?? 1} invitados`
              : undefined;
        return [{ dateISO: r.date, hour, client: r.customerName, status: r.status, detail }];
      });
    return [...seeded, ...real];
  }, [reservations, bizId, bizName]);

  const eventsOn = (dateISO: string, hour: number) =>
    events.filter((e) => e.dateISO === dateISO && e.hour === hour);
  const countOn = (dateISO: string) => events.filter((e) => e.dateISO === dateISO).length;

  // ---- Días visibles según la vista ----
  const weekDays = useMemo(() => {
    const mon = mondayOf(cursor);
    return Array.from({ length: 7 }, (_, i) => new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i));
  }, [cursor]);

  const rangeLabel = useMemo(() => {
    if (view === 'Día') return formatDateLabel(toISO(cursor));
    if (view === 'Mes') return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const a = weekDays[0], b = weekDays[6];
    return `${a.getDate()} – ${b.getDate()} ${MONTH_NAMES[b.getMonth()]} ${b.getFullYear()}`;
  }, [view, cursor, weekDays]);

  // Navegación anterior/siguiente según la vista.
  const shift = (dir: 1 | -1) => {
    const d = new Date(cursor);
    if (view === 'Día') d.setDate(d.getDate() + dir);
    else if (view === 'Semana') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
    setMiniMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  // ---- Mini calendario ----
  const miniCells = calendarCells(miniMonth.y, miniMonth.m);
  const miniPrev = () => setMiniMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const miniNext = () => setMiniMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const pickMiniDay = (d: number) => {
    const picked = new Date(miniMonth.y, miniMonth.m, d);
    setCursor(picked);
    setView('Día');
  };
  const todayStr = todayISO();

  // ---- Nueva reserva ----
  const openNew = () => {
    const start = toISO(cursor);
    setForm({
      client: '',
      serviceId: services[0]?.id ?? bizId ?? '',
      date: start,
      checkOut: nextDayISO(start),
      time: mode === 'dia' ? cfg.checkInTime : '',
      people: mode === 'mesa' ? 2 : mode === 'evento' ? 50 : 1,
    });
    setFormError(null);
    setNewOpen(true);
  };

  const saveNew = () => {
    if (!bizId || !bizName) { setFormError('Tu cuenta no tiene un negocio asignado.'); return; }
    if (!form.client.trim()) { setFormError('Escribe el nombre del cliente.'); return; }
    if (!form.date) { setFormError('Elige una fecha.'); return; }
    if (form.date < todayStr) { setFormError('No puedes agendar en una fecha pasada.'); return; }

    const serviceId = form.serviceId || bizId;
    const detail = serviceDetails[serviceId];
    const serviceName = detail?.name ?? bizName;
    const nights = mode === 'dia' ? nightsBetween(form.date, form.checkOut) : 0;

    if (mode === 'dia') {
      if (!form.checkOut || form.checkOut <= form.date) {
        setFormError('La fecha de salida debe ser posterior a la de entrada.');
        return;
      }
      if (nights < cfg.minNights) {
        setFormError(`La estancia mínima es de ${cfg.minNights} ${cfg.minNights === 1 ? 'noche' : 'noches'}.`);
        return;
      }
    } else {
      if (!form.time) { setFormError('Elige un horario.'); return; }
      if (slotHasPassed(form.date, form.time)) { setFormError('Ese horario ya pasó para hoy.'); return; }
    }

    const ok = book({
      serviceId,
      serviceName,
      image: detail?.image ?? '',
      address: detail?.address ?? '',
      date: form.date,
      dateLabel: formatDateLabel(form.date),
      time: mode === 'dia' ? cfg.checkInTime : form.time,
      customerName: form.client.trim(),
      mode,
      people: form.people,
      total: bookingTotal(mode, detail?.price ?? 0, { nights, people: form.people }),
      ...(mode === 'dia' && {
        checkOut: form.checkOut,
        checkOutLabel: formatDateLabel(form.checkOut),
        checkOutTime: cfg.checkOutTime,
        nights,
      }),
    });

    if (!ok) {
      setFormError(
        mode === 'dia' ? 'No quedan unidades libres en esas fechas.'
          : mode === 'mesa' ? `No hay mesas para ${form.people} personas en ese horario.`
            : mode === 'evento' ? 'Ese turno ya está apartado por otro evento. Elige otro.'
              : 'Ese horario ya está lleno. Elige otro.',
      );
      return;
    }
    setCursor(new Date(form.date + 'T00:00:00'));
    setView('Día');
    setNewOpen(false);
  };

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
          <button className="ad__btn" onClick={openNew}>+ Nueva reserva</button>
        </div>
      </header>

      {/* Barra de navegación de rango */}
      <div className="ac__rangebar">
        <button className="ac__range-nav" onClick={() => shift(-1)} aria-label="Anterior">‹</button>
        <span className="ac__range-label">{rangeLabel}</span>
        <button className="ac__range-nav" onClick={() => shift(1)} aria-label="Siguiente">›</button>
        <button className="ac__today-btn" onClick={() => { const t = new Date(); setCursor(t); setMiniMonth({ y: t.getFullYear(), m: t.getMonth() }); }}>Hoy</button>
      </div>

      <div className="ac__layout">
        {/* Columna izquierda: mini calendario + estado */}
        <aside className="ac__side">
          <div className="ac__panel">
            <div className="ac__mini-head">
              <button className="ac__mini-nav" onClick={miniPrev} aria-label="Mes anterior">‹</button>
              <span className="ac__mini-title">{MONTH_NAMES[miniMonth.m]} {miniMonth.y}</span>
              <button className="ac__mini-nav" onClick={miniNext} aria-label="Mes siguiente">›</button>
            </div>
            <div className="ac__mini-grid ac__mini-grid--head">
              {MINI_DAYS.map((d, i) => <span key={i} className="ac__mini-dayname">{d}</span>)}
            </div>
            <div className="ac__mini-grid">
              {miniCells.map((d, i) => {
                if (d === null) return <span key={i} className="ac__mini-cell is-empty" />;
                const iso = `${miniMonth.y}-${pad(miniMonth.m + 1)}-${pad(d)}`;
                const isToday = iso === todayStr;
                const isSelected = iso === toISO(cursor);
                const has = countOn(iso) > 0;
                return (
                  <button
                    key={i}
                    className={`ac__mini-cell ac__mini-cell--btn ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => pickMiniDay(d)}
                  >
                    {d}
                    {has && <span className="ac__mini-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ac__panel">
            <h3 className="ac__panel-title">Estado</h3>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-green)' }} /> Confirmada</label>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-amber)' }} /> Pendiente</label>
            <label className="ac__legend"><span className="ac__legend-dot" style={{ background: 'var(--rv-red)' }} /> Cancelada</label>
          </div>
        </aside>

        {/* Vista principal */}
        {view === 'Mes' ? (
          <MonthView cursor={cursor} countOn={countOn} onPick={(d) => { setCursor(d); setView('Día'); }} todayStr={todayStr} />
        ) : (
          <div className="ac__grid-wrap">
            <div
              className="ac__grid"
              style={view === 'Día' ? { gridTemplateColumns: '56px 1fr', minWidth: 'auto' } : undefined}
            >
              {/* Encabezado de días */}
              <div className="ac__cell ac__cell--corner" />
              {(view === 'Día' ? [cursor] : weekDays).map((d, i) => (
                <div key={i} className={`ac__cell ac__col-head ${toISO(d) === todayStr ? 'is-today-col' : ''}`}>
                  <span className="ac__col-day">{view === 'Día' ? WEEK_DAYNAMES[(d.getDay() + 6) % 7] : WEEK_DAYNAMES[i]}</span>
                  <span className="ac__col-date">{d.getDate()}</span>
                </div>
              ))}

              {/* Filas por hora */}
              {calendarHours.map((h) => (
                <div key={h} className="ac__row" style={{ display: 'contents' }}>
                  <div className="ac__cell ac__hour">{h}:00</div>
                  {(view === 'Día' ? [cursor] : weekDays).map((d, dayIdx) => {
                    const iso = toISO(d);
                    const evs = eventsOn(iso, h);
                    return (
                      <div key={dayIdx} className="ac__slot-cell ac__cell">
                        {evs.map((ev, k) => (
                          <div key={k} className={`ac__event ac__event--${ev.status}`}>
                            <span className="ac__event-client">{ev.client}</span>
                            <span className="ac__event-service">{ev.detail ?? `${h}:00`}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal nueva reserva */}
      <Modal open={newOpen} title="Nueva reserva" onClose={() => setNewOpen(false)}>
        <p className="ac__new-hint">
          Agenda para <strong>{bizName}</strong> · {bookingModeLabel(mode)}.
        </p>
        <div className="rv-form-field">
          <span className="rv-form-label">Nombre del cliente</span>
          <input className="rv-form-input" value={form.client} placeholder="Ej. Juan Pérez"
            onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} />
        </div>

        {/* Servicio/habitación (si el negocio ofrece más de uno) */}
        {services.length > 1 && (
          <div className="rv-form-field">
            <span className="rv-form-label">Servicio</span>
            <select className="rv-form-input" value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="rv-form-field">
          <span className="rv-form-label">{mode === 'dia' ? 'Entrada (check-in)' : 'Fecha'}</span>
          <input className="rv-form-input" type="date" min={todayStr} value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>

        {mode === 'dia' ? (
          <>
            <div className="rv-form-field">
              <span className="rv-form-label">Salida (check-out)</span>
              <input className="rv-form-input" type="date" min={nextDayISO(form.date || todayStr)} value={form.checkOut}
                onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} />
            </div>
            <p className="ac__new-hint">
              {nightsBetween(form.date, form.checkOut)} {nightsBetween(form.date, form.checkOut) === 1 ? 'noche' : 'noches'}
              {' · '}Check-in {cfg.checkInTime} · Check-out {cfg.checkOutTime}
            </p>
          </>
        ) : (
          <div className="rv-form-field">
            <span className="rv-form-label">{mode === 'evento' ? 'Turno' : 'Horario'}</span>
            <div className="ac__slot-grid">
              {TIME_SLOTS.map((slot) => {
                const passed = slotHasPassed(form.date, slot);
                return (
                  <button key={slot} type="button" disabled={passed}
                    className={`ac__slot-pick ${form.time === slot ? 'is-selected' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, time: slot }))}>
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode !== 'hora' && (
          <div className="rv-form-field">
            <span className="rv-form-label">
              {mode === 'mesa' ? 'Personas en la mesa'
                : mode === 'dia' ? 'Huéspedes'
                  : mode === 'evento' ? 'Invitados' : 'Lugares'}
            </span>
            <div className="ac__people">
              <button type="button" className="ac__people-btn"
                onClick={() => setForm((f) => ({ ...f, people: Math.max(1, f.people - peopleStep) }))}>−</button>
              <span className="ac__people-value">{form.people}</span>
              <button type="button" className="ac__people-btn"
                onClick={() => setForm((f) => ({ ...f, people: f.people + peopleStep }))}>+</button>
            </div>
          </div>
        )}

        {formError && <p className="rv-form-error">{formError}</p>}
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setNewOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={saveNew}>Agendar</button>
        </div>
      </Modal>

      <footer className="ad__footer">Calendario · 16/20</footer>
    </AdminLayout>
  );
}

/* Vista de mes: cuadrícula con el nº de reservas por día. */
function MonthView({
  cursor, countOn, onPick, todayStr,
}: {
  cursor: Date;
  countOn: (iso: string) => number;
  onPick: (d: Date) => void;
  todayStr: string;
}) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const cells = calendarCells(y, m);
  return (
    <div className="ac__month">
      <div className="ac__month-head">
        {WEEK_DAYNAMES.map((d) => <span key={d} className="ac__month-dayname">{d}</span>)}
      </div>
      <div className="ac__month-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} className="ac__month-cell is-empty" />;
          const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
          const n = countOn(iso);
          return (
            <button
              key={i}
              className={`ac__month-cell ${iso === todayStr ? 'is-today' : ''}`}
              onClick={() => onPick(new Date(y, m, d))}
            >
              <span className="ac__month-num">{d}</span>
              {n > 0 && <span className="ac__month-count">{n} {n === 1 ? 'reserva' : 'reservas'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
