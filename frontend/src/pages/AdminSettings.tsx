import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { settingsTabs, businessHours } from '../data/adminData';
import { TIME_SLOTS } from '../data/slots';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminSettings.css';

// Pantalla 20/20 — Configuración (Panel Administrador)
export default function AdminSettings() {
  const [tab, setTab] = useState(settingsTabs[0]);
  const [hours, setHours] = useState(businessHours);
  const { capacity, setCapacity, getTables, addTable, removeTable, setTableSeats } = useStore();
  const { user } = useAuth();

  // Las mesas solo aplican a negocios de alimentos (restaurantes).
  const isRestaurant = user?.businessType === 'alimentos';
  const tables = getTables(user?.businessId);
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const [newSeats, setNewSeats] = useState(2);

  const toggleDay = (i: number) =>
    setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, open: !h.open } : h)));

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

        {/* Contenido */}
        <section className="as__panel">
          {/* Perfil del negocio */}
          <h2 className="as__section-title">Perfil del negocio</h2>
          <div className="as__logo-row">
            <div className="as__logo">{user?.initials ?? 'RV'}</div>
            <button className="ad__btn ad__btn--ghost">Cambiar logo</button>
          </div>

          <div className="as__grid">
            <label className="as__field">
              <span className="as__label">Nombre del negocio</span>
              <input className="as__input" key={user?.name} defaultValue={user?.name ?? 'Barbería Elite'} />
            </label>
            <label className="as__field">
              <span className="as__label">Categoría</span>
              <input className="as__input" defaultValue="Belleza" />
            </label>
            <label className="as__field">
              <span className="as__label">Teléfono</span>
              <input className="as__input" defaultValue="(55) 1234 5678" />
            </label>
            <label className="as__field">
              <span className="as__label">Correo de contacto</span>
              <input className="as__input" defaultValue="contacto@barberiaelite.com" />
            </label>
          </div>

          <label className="as__field">
            <span className="as__label">Dirección</span>
            <input className="as__input" defaultValue="Av. Universidad 123, Col. Centro" />
          </label>

          <label className="as__field">
            <span className="as__label">Descripción</span>
            <textarea
              className="as__input as__textarea"
              defaultValue="Corte profesional, afeitado y tratamientos para el cuidado personal. Contamos con barberos expertos y productos de alta calidad."
            />
          </label>

          <hr className="as__divider" />

          {/* Horarios de atención */}
          <h2 className="as__section-title">Horarios de atención</h2>
          <div className="as__hours">
            {hours.map((h, i) => (
              <div key={h.day} className="as__hour-row">
                <span className="as__hour-day">{h.day}</span>
                <button
                  className={`as__switch ${h.open ? 'is-on' : ''}`}
                  onClick={() => toggleDay(i)}
                  aria-label={`Alternar ${h.day}`}
                >
                  <span className="as__switch-knob" />
                </button>
                <span className={`as__hour-value ${!h.open ? 'is-closed' : ''}`}>
                  {h.open ? h.hours : 'Cerrado'}
                </span>
              </div>
            ))}
          </div>

          <hr className="as__divider" />

          {/* Espacios (cupos) por horario */}
          <h2 className="as__section-title">Espacios disponibles por horario</h2>
          <p className="as__hint">
            Define cuántas reservas puedes atender al mismo tiempo en cada horario.
            El cliente verá los lugares disponibles y no podrá reservar cuando se agoten.
          </p>
          <div className="as__slots">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="as__slot">
                <span className="as__slot-time">{slot}</span>
                <div className="as__stepper">
                  <button
                    type="button"
                    className="as__step"
                    onClick={() => setCapacity(slot, (capacity[slot] ?? 1) - 1)}
                    aria-label={`Menos espacios ${slot}`}
                  >
                    −
                  </button>
                  <input
                    className="as__step-value"
                    type="number"
                    min={0}
                    value={capacity[slot] ?? 1}
                    onChange={(e) => setCapacity(slot, Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="as__step"
                    onClick={() => setCapacity(slot, (capacity[slot] ?? 1) + 1)}
                    aria-label={`Más espacios ${slot}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mesas (solo restaurantes) */}
          {isRestaurant && (
            <>
              <hr className="as__divider" />
              <div className="as__mesas-head">
                <h2 className="as__section-title">Mesas del restaurante</h2>
                <span className="as__mesas-summary">
                  {tables.length} {tables.length === 1 ? 'mesa' : 'mesas'} · {totalSeats} lugares
                </span>
              </div>
              <p className="as__hint">
                Administra tus mesas: agrega o quita mesas e indica para cuántas personas es cada una.
              </p>

              <div className="as__mesas">
                {tables.map((t, i) => (
                  <div key={t.id} className="as__mesa">
                    <span className="as__mesa-name">🍽️ Mesa {i + 1}</span>
                    <div className="as__stepper">
                      <button type="button" className="as__step" onClick={() => setTableSeats(user!.businessId!, t.id, t.seats - 1)} aria-label="Menos personas">−</button>
                      <span className="as__mesa-seats">{t.seats} pers.</span>
                      <button type="button" className="as__step" onClick={() => setTableSeats(user!.businessId!, t.id, t.seats + 1)} aria-label="Más personas">+</button>
                    </div>
                    <button type="button" className="as__mesa-remove" onClick={() => removeTable(user!.businessId!, t.id)} aria-label="Quitar mesa">🗑</button>
                  </div>
                ))}
              </div>

              {/* Agregar mesa */}
              <div className="as__mesa-add">
                <span className="as__mesa-add-label">Nueva mesa para</span>
                <div className="as__stepper">
                  <button type="button" className="as__step" onClick={() => setNewSeats((n) => Math.max(1, n - 1))}>−</button>
                  <span className="as__mesa-seats">{newSeats} pers.</span>
                  <button type="button" className="as__step" onClick={() => setNewSeats((n) => n + 1)}>+</button>
                </div>
                <button
                  type="button"
                  className="ad__btn"
                  onClick={() => user?.businessId && addTable(user.businessId, newSeats)}
                >
                  + Agregar mesa
                </button>
              </div>
            </>
          )}

          {/* Acciones */}
          <div className="as__actions">
            <button className="ad__btn ad__btn--ghost">Cancelar</button>
            <button className="ad__btn">Guardar cambios</button>
          </div>
        </section>
      </div>

      <footer className="ad__footer">Configuración · 20/20</footer>
    </AdminLayout>
  );
}
