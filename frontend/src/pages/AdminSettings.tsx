import { useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { settingsTabs } from '../data/adminData';
import { businessCategories } from '../data/businesses';
import { bookingModes } from '../data/bookingModes';
import type { BookingMode } from '../data/bookingModes';
import { TIME_SLOTS } from '../data/slots';
import { useStore } from '../store/StoreContext';
import type { DayHours } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { readImageFile } from '../utils/image';
import '../styles/variables.css';
import './AdminSettings.css';

// Horario por defecto (editable por el admin).
const DEFAULT_HOURS: DayHours[] = [
  { day: 'Lunes', open: true, from: '09:00', to: '20:00' },
  { day: 'Martes', open: true, from: '09:00', to: '20:00' },
  { day: 'Miércoles', open: true, from: '09:00', to: '20:00' },
  { day: 'Jueves', open: true, from: '09:00', to: '20:00' },
  { day: 'Viernes', open: true, from: '09:00', to: '20:00' },
  { day: 'Sábado', open: true, from: '10:00', to: '16:00' },
  { day: 'Domingo', open: false, from: '10:00', to: '14:00' },
];

// Pantalla 20/20 — Configuración (Panel Administrador)
export default function AdminSettings() {
  const [tab, setTab] = useState(settingsTabs[0]);
  const {
    getTables, addTable, removeTable, setTableSeats,
    customCategories, addCustomCategory, getProfile, setProfile,
    getBookingConfig, setBookingConfig, setSlotCapacity,
  } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId ?? '';
  const logoRef = useRef<HTMLInputElement>(null);

  // Tipo de reservas del negocio (por hora, por día, por cupo o por mesa).
  const booking = getBookingConfig(bizId, user?.businessType);
  const mode = booking.mode;
  const setMode = (m: BookingMode) => setBookingConfig(bizId, { mode: m });

  const profile = getProfile(bizId);
  const defaultCategory = businessCategories.find((c) => c.type === user?.businessType)?.label ?? 'Belleza';

  // Estado local del perfil (se guarda al store al presionar Guardar).
  const [name, setName] = useState(profile.name ?? user?.businessName ?? user?.name ?? '');
  const [category, setCategory] = useState(profile.category ?? defaultCategory);
  const [phone, setPhone] = useState(profile.phone ?? user?.phone ?? '');
  const [email, setEmail] = useState(profile.email ?? user?.email ?? '');
  const [address, setAddress] = useState(profile.address ?? user?.businessAddress ?? '');
  const [description, setDescription] = useState(profile.description ?? user?.businessDescription ?? '');
  const [hours, setHours] = useState<DayHours[]>(profile.hours ?? DEFAULT_HOURS);
  const [instagram, setInstagram] = useState(profile.instagram ?? '');
  const [facebook, setFacebook] = useState(profile.facebook ?? '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Modal agregar categoría
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState('');

  // Mesas (se administran cuando el negocio reserva por mesa)
  const tables = getTables(bizId);
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const [newSeats, setNewSeats] = useState(2);

  // Notificaciones y métodos de pago del negocio (sesión)
  const [notif, setNotif] = useState({ nuevas: true, cambios: true, resumen: false });
  const [pays, setPays] = useState({ tarjeta: true, efectivo: true, transferencia: false, paypal: false });

  // Seguridad
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const categoryOptions = Array.from(new Set([
    ...businessCategories.map((c) => c.label),
    ...customCategories,
    category,
  ]));

  const toggleDay = (i: number) =>
    setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, open: !h.open } : h)));
  const setHourField = (i: number, field: 'from' | 'to', value: string) =>
    setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readImageFile(file);
      setProfile(bizId, { logo: url });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo cargar el logo.');
    }
    e.target.value = '';
  };

  const addCategory = () => {
    const c = newCat.trim();
    if (!c) return;
    addCustomCategory(c);
    setCategory(c);
    setNewCat('');
    setCatOpen(false);
  };

  const saveProfile = () => {
    setProfile(bizId, { name, category, phone, email, address, description, hours, instagram, facebook, whatsapp });
    setSavedMsg('Cambios guardados ✓');
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const changePassword = () => {
    if (pwd.next.length < 6) { setPwdMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 6 caracteres.' }); return; }
    if (pwd.next !== pwd.confirm) { setPwdMsg({ ok: false, text: 'Las contraseñas no coinciden.' }); return; }
    setPwd({ current: '', next: '', confirm: '' });
    setPwdMsg({ ok: true, text: 'Contraseña actualizada correctamente ✓' });
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Configuración</h1>
      </header>

      <div className="as__layout">
        {/* Pestañas laterales */}
        <aside className="as__tabs">
          {settingsTabs.map((t) => (
            <button
              key={t}
              className={`as__tab ${tab === t ? 'is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </aside>

        {/* Contenido según la pestaña activa */}
        <section className="as__panel">
          {/* ---------- PERFIL DEL NEGOCIO ---------- */}
          {tab === 'Perfil del negocio' && (
            <>
              <h2 className="as__section-title">Perfil del negocio</h2>
              <div className="as__logo-row">
                {profile.logo ? (
                  <img className="as__logo as__logo--img" src={profile.logo} alt="Logo" />
                ) : (
                  <div className="as__logo">{user?.initials ?? 'RV'}</div>
                )}
                <button className="ad__btn ad__btn--ghost" onClick={() => logoRef.current?.click()}>Cambiar logo</button>
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={onPickLogo} />
              </div>

              <div className="as__grid">
                <label className="as__field">
                  <span className="as__label">Nombre del negocio</span>
                  <input className="as__input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="as__field">
                  <span className="as__label">Categoría</span>
                  <div className="as__cat-row">
                    <select className="as__input as__select" value={category} onChange={(e) => setCategory(e.target.value)}>
                      {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" className="as__cat-add" onClick={() => setCatOpen(true)} title="Agregar categoría">+</button>
                  </div>
                </label>
                <label className="as__field">
                  <span className="as__label">Teléfono</span>
                  <input className="as__input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="as__field">
                  <span className="as__label">Correo de contacto</span>
                  <input className="as__input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>

              <label className="as__field">
                <span className="as__label">Dirección</span>
                <input className="as__input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, colonia" />
              </label>

              <label className="as__field">
                <span className="as__label">Descripción</span>
                <textarea className="as__input as__textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe tu negocio..." />
              </label>

              <hr className="as__divider" />
              <h2 className="as__section-title">Redes sociales</h2>
              <p className="as__hint">Se mostrarán a los clientes en la página de tu negocio.</p>
              <div className="as__grid">
                <label className="as__field">
                  <span className="as__label">📷 Instagram</span>
                  <input className="as__input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tunegocio" />
                </label>
                <label className="as__field">
                  <span className="as__label">📘 Facebook</span>
                  <input className="as__input" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/tunegocio" />
                </label>
                <label className="as__field">
                  <span className="as__label">🟢 WhatsApp</span>
                  <input className="as__input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="55 1234 5678" />
                </label>
              </div>

              <div className="as__actions">
                {savedMsg && <span className="as__saved">{savedMsg}</span>}
                <button className="ad__btn" onClick={saveProfile}>Guardar cambios</button>
              </div>
            </>
          )}

          {/* ---------- HORARIOS DE ATENCIÓN ---------- */}
          {tab === 'Horarios de atención' && (
            <>
              <h2 className="as__section-title">Horarios de atención</h2>
              <p className="as__hint">Activa cada día y ajusta la hora de apertura y cierre.</p>
              <div className="as__hours">
                {hours.map((h, i) => (
                  <div key={h.day} className="as__hour-row as__hour-row--edit">
                    <span className="as__hour-day">{h.day}</span>
                    <button
                      className={`as__switch ${h.open ? 'is-on' : ''}`}
                      onClick={() => toggleDay(i)}
                      aria-label={`Alternar ${h.day}`}
                    >
                      <span className="as__switch-knob" />
                    </button>
                    {h.open ? (
                      <div className="as__hour-range">
                        <input type="time" className="as__time" value={h.from} onChange={(e) => setHourField(i, 'from', e.target.value)} />
                        <span className="as__hour-sep">a</span>
                        <input type="time" className="as__time" value={h.to} onChange={(e) => setHourField(i, 'to', e.target.value)} />
                      </div>
                    ) : (
                      <span className="as__hour-value is-closed">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="as__hint">
                Los cupos, mesas o habitaciones se configuran en la pestaña
                <strong> Tipo de reservas</strong>.
              </p>

              <div className="as__actions">
                {savedMsg && <span className="as__saved">{savedMsg}</span>}
                <button className="ad__btn" onClick={saveProfile}>Guardar horarios</button>
              </div>
            </>
          )}

          {/* ---------- TIPO DE RESERVAS ---------- */}
          {tab === 'Tipo de reservas' && (
            <>
              <h2 className="as__section-title">¿Cómo reservan tus clientes?</h2>
              <p className="as__hint">
                Elige el tipo de reserva de tu negocio. El cliente verá el flujo que
                corresponda: elegir hora, elegir fechas de entrada y salida, apartar
                lugares, pedir mesa para cierto número de personas o apartar el
                salón completo para un evento.
              </p>

              <div className="as__modes">
                {bookingModes.map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    className={`as__mode ${mode === m.mode ? 'is-active' : ''}`}
                    onClick={() => setMode(m.mode)}
                  >
                    <span className="as__mode-icon">{m.icon}</span>
                    <span className="as__mode-body">
                      <span className="as__mode-label">{m.label}</span>
                      <span className="as__mode-hint">{m.hint}</span>
                    </span>
                    <span className={`as__mode-check ${mode === m.mode ? 'is-on' : ''}`} />
                  </button>
                ))}
              </div>

              <hr className="as__divider" />

              {/* --- Ajustes de cada tipo --- */}
              {(mode === 'hora' || mode === 'cupo') && (
                <>
                  <h2 className="as__section-title">
                    {mode === 'hora' ? 'Espacios disponibles por horario' : 'Cupo (lugares) por horario'}
                  </h2>
                  <p className="as__hint">
                    {mode === 'hora'
                      ? 'Cuántas citas puedes atender al mismo tiempo en cada horario.'
                      : 'Cuántas personas caben en cada horario. Una reserva puede apartar varios lugares.'}
                  </p>
                  <div className="as__slots">
                    {TIME_SLOTS.map((slot) => {
                      const n = booking.slotCapacity[slot] ?? 1;
                      return (
                        <div key={slot} className="as__slot">
                          <span className="as__slot-time">{slot}</span>
                          <div className="as__stepper">
                            <button type="button" className="as__step" onClick={() => setSlotCapacity(bizId, slot, n - 1)} aria-label={`Menos espacios ${slot}`}>−</button>
                            <input className="as__step-value" type="number" min={0} value={n} onChange={(e) => setSlotCapacity(bizId, slot, Number(e.target.value))} />
                            <button type="button" className="as__step" onClick={() => setSlotCapacity(bizId, slot, n + 1)} aria-label={`Más espacios ${slot}`}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {mode === 'cupo' && (
                    <label className="as__field">
                      <span className="as__label">Máximo de lugares por reserva</span>
                      <input
                        className="as__input" type="number" min={1} value={booking.maxPeople}
                        onChange={(e) => setBookingConfig(bizId, { maxPeople: Math.max(1, Number(e.target.value)) })}
                      />
                    </label>
                  )}
                </>
              )}

              {mode === 'dia' && (
                <>
                  <h2 className="as__section-title">Reservas por día</h2>
                  <p className="as__hint">
                    El cliente elige fecha de entrada y de salida; se cobra por noche.
                  </p>
                  <div className="as__grid">
                    <label className="as__field">
                      <span className="as__label">Hora de check-in</span>
                      <select className="as__input as__select" value={booking.checkInTime}
                        onChange={(e) => setBookingConfig(bizId, { checkInTime: e.target.value })}>
                        {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="as__field">
                      <span className="as__label">Hora de check-out</span>
                      <select className="as__input as__select" value={booking.checkOutTime}
                        onChange={(e) => setBookingConfig(bizId, { checkOutTime: e.target.value })}>
                        {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="as__field">
                      <span className="as__label">Unidades por tipo de habitación</span>
                      <input className="as__input" type="number" min={1} value={booking.units}
                        onChange={(e) => setBookingConfig(bizId, { units: Math.max(1, Number(e.target.value)) })} />
                    </label>
                    <label className="as__field">
                      <span className="as__label">Mínimo de noches</span>
                      <input className="as__input" type="number" min={1} value={booking.minNights}
                        onChange={(e) => setBookingConfig(bizId, { minNights: Math.max(1, Number(e.target.value)) })} />
                    </label>
                  </div>
                </>
              )}

              {mode === 'mesa' && (
                <>
                  <div className="as__mesas-head">
                    <h2 className="as__section-title">Mesas del negocio</h2>
                    <span className="as__mesas-summary">{tables.length} {tables.length === 1 ? 'mesa' : 'mesas'} · {totalSeats} lugares</span>
                  </div>
                  <p className="as__hint">
                    El cliente indica cuántas personas y el sistema le asigna la mesa
                    libre más justa para ese horario.
                  </p>
                  <div className="as__mesas">
                    {tables.map((t, i) => (
                      <div key={t.id} className="as__mesa">
                        <span className="as__mesa-name">🍽️ Mesa {i + 1}</span>
                        <div className="as__stepper">
                          <button type="button" className="as__step" onClick={() => setTableSeats(bizId, t.id, t.seats - 1)} aria-label="Menos personas">−</button>
                          <span className="as__mesa-seats">{t.seats} pers.</span>
                          <button type="button" className="as__step" onClick={() => setTableSeats(bizId, t.id, t.seats + 1)} aria-label="Más personas">+</button>
                        </div>
                        <button type="button" className="as__mesa-remove" onClick={() => removeTable(bizId, t.id)} aria-label="Quitar mesa">🗑</button>
                      </div>
                    ))}
                    {tables.length === 0 && (
                      <p className="as__hint">Aún no has agregado mesas. Agrega al menos una para recibir reservas.</p>
                    )}
                  </div>
                  <div className="as__mesa-add">
                    <span className="as__mesa-add-label">Nueva mesa para</span>
                    <div className="as__stepper">
                      <button type="button" className="as__step" onClick={() => setNewSeats((n) => Math.max(1, n - 1))}>−</button>
                      <span className="as__mesa-seats">{newSeats} pers.</span>
                      <button type="button" className="as__step" onClick={() => setNewSeats((n) => n + 1)}>+</button>
                    </div>
                    <button type="button" className="ad__btn" onClick={() => addTable(bizId, newSeats)}>+ Agregar mesa</button>
                  </div>
                </>
              )}

              {mode === 'evento' && (
                <>
                  <h2 className="as__section-title">Reservas por evento</h2>
                  <p className="as__hint">
                    Cada turno se aparta completo: solo se acepta un evento a la vez
                    en el mismo horario. El cliente elige el día, el turno y cuántos
                    invitados llevará; el total se cobra por invitado.
                  </p>
                  <label className="as__field">
                    <span className="as__label">Máximo de invitados por evento</span>
                    <input
                      className="as__input" type="number" min={1} value={booking.maxPeople}
                      onChange={(e) => setBookingConfig(bizId, { maxPeople: Math.max(1, Number(e.target.value)) })}
                    />
                  </label>
                </>
              )}

              <p className="as__saved">Los cambios de este apartado se guardan al momento ✓</p>
            </>
          )}

          {/* ---------- NOTIFICACIONES ---------- */}
          {tab === 'Notificaciones' && (
            <>
              <h2 className="as__section-title">Notificaciones</h2>
              <p className="as__hint">Elige qué avisos quieres recibir sobre tu negocio.</p>
              {([
                ['nuevas', 'Nueva reserva recibida'],
                ['cambios', 'Cambios y cancelaciones'],
                ['resumen', 'Resumen diario por correo'],
              ] as const).map(([k, label]) => (
                <div key={k} className="as__hour-row">
                  <span className="as__hour-day" style={{ flex: 1 }}>{label}</span>
                  <button className={`as__switch ${notif[k] ? 'is-on' : ''}`} onClick={() => setNotif((n) => ({ ...n, [k]: !n[k] }))} aria-label={label}>
                    <span className="as__switch-knob" />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ---------- MÉTODOS DE PAGO ---------- */}
          {tab === 'Métodos de pago' && (
            <>
              <h2 className="as__section-title">Métodos de pago aceptados</h2>
              <p className="as__hint">Selecciona las formas de pago que aceptas de tus clientes.</p>
              {([
                ['tarjeta', '💳 Tarjeta de crédito/débito'],
                ['efectivo', '💵 Efectivo en el lugar'],
                ['transferencia', '🏦 Transferencia bancaria'],
                ['paypal', '🅿️ PayPal'],
              ] as const).map(([k, label]) => (
                <div key={k} className="as__hour-row">
                  <span className="as__hour-day" style={{ flex: 1 }}>{label}</span>
                  <button className={`as__switch ${pays[k] ? 'is-on' : ''}`} onClick={() => setPays((p) => ({ ...p, [k]: !p[k] }))} aria-label={label}>
                    <span className="as__switch-knob" />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ---------- SEGURIDAD ---------- */}
          {tab === 'Seguridad' && (
            <>
              <h2 className="as__section-title">Seguridad</h2>
              <p className="as__hint">Cambia la contraseña de acceso a tu panel.</p>
              <label className="as__field">
                <span className="as__label">Contraseña actual</span>
                <input className="as__input" type="password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} />
              </label>
              <label className="as__field">
                <span className="as__label">Nueva contraseña</span>
                <input className="as__input" type="password" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} />
              </label>
              <label className="as__field">
                <span className="as__label">Confirmar nueva contraseña</span>
                <input className="as__input" type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
              </label>
              {pwdMsg && <p className={pwdMsg.ok ? 'as__saved' : 'rv-form-error'}>{pwdMsg.text}</p>}
              <div className="as__actions">
                <button className="ad__btn" onClick={changePassword}>Actualizar contraseña</button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal agregar categoría */}
      <Modal open={catOpen} title="Nueva categoría" onClose={() => setCatOpen(false)} width={400}>
        <div className="rv-form-field">
          <span className="rv-form-label">Nombre de la categoría</span>
          <input className="rv-form-input" value={newCat} placeholder="Ej. Spa, Hotel, Estética..." autoFocus
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
        </div>
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setCatOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={addCategory}>Agregar</button>
        </div>
      </Modal>

      <footer className="ad__footer">Configuración · 20/20</footer>
    </AdminLayout>
  );
}
