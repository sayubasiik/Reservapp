import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { calendarEvents, clients as mockClients } from '../data/adminData';
import { businessInitials, belongsToBusiness } from '../data/businesses';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminClients.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Correo de ejemplo a partir del nombre (quita acentos con escapes unicode).
const emailFor = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.') + '@correo.com';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

type FilterKey = 'todos' | 'activos' | 'recurrentes' | 'nuevos';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'activos', label: 'Activos' },
  { key: 'recurrentes', label: 'Recurrentes (2+)' },
  { key: 'nuevos', label: 'Nuevos (1)' },
];

// Pantalla 17/20 — Clientes (Panel Administrador) · por negocio
export default function AdminClients() {
  const { reservations, getManualClients, addManualClient } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;
  const bizName = user?.name;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const manual = getManualClients(bizId);

  // Clientes de ESTE negocio: agenda + reservas + agregados manualmente.
  const list = useMemo(() => {
    const names = Array.from(new Set([
      ...calendarEvents.filter((e) => !bizName || e.service === bizName).map((e) => e.client),
      ...reservations.filter((r) => belongsToBusiness(r.serviceId, bizId)).map((r) => r.customerName),
    ]));

    const fromNames = names.map((name) => {
      const mock = mockClients.find((c) => c.name === name);
      const bookedHere = reservations.filter(
        (r) => belongsToBusiness(r.serviceId, bizId) && r.customerName === name && r.status !== 'cancelada',
      ).length;
      if (mock) return { ...mock, reservations: mock.reservations + bookedHere };
      return {
        initials: businessInitials(name),
        name,
        email: emailFor(name),
        phone: '—',
        reservations: bookedHere || 1,
        lastVisit: '—',
        active: true,
      };
    });

    const fromManual = manual.map((c) => ({
      initials: businessInitials(c.name),
      name: c.name,
      email: c.email,
      phone: c.phone,
      reservations: 0,
      lastVisit: 'Nuevo',
      active: true,
    }));

    return [...fromManual, ...fromNames];
  }, [reservations, bizId, bizName, manual]);

  // Aplica búsqueda + filtro.
  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return list.filter((c) => {
      const matchesText = !q || norm(c.name).includes(q) || norm(c.email).includes(q) || c.phone.includes(search.trim());
      const matchesFilter =
        filter === 'todos' ||
        (filter === 'activos' && c.active) ||
        (filter === 'recurrentes' && c.reservations > 1) ||
        (filter === 'nuevos' && c.reservations <= 1);
      return matchesText && matchesFilter;
    });
  }, [list, search, filter]);

  const total = list.length;
  const recurrentes = list.filter((c) => c.reservations > 1).length;
  const stats = [
    { label: 'Clientes del negocio', value: String(total), delta: 'este negocio' },
    { label: 'Recurrentes', value: String(recurrentes), delta: '2+ reservas' },
    { label: 'Nuevos', value: String(total - recurrentes), delta: '1 reserva' },
  ];

  const submitNew = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Escribe el nombre.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Correo con formato inválido.';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Teléfono de al menos 10 dígitos.';
    setErrors(e);
    if (Object.keys(e).length || !bizId) return;
    addManualClient(bizId, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setForm({ name: '', email: '', phone: '' });
    setAddOpen(false);
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Clientes</h1>
      </header>

      {/* Tarjetas resumen (de este negocio) */}
      <section className="acl__stats">
        {stats.map((s) => (
          <div key={s.label} className="acl__stat">
            <span className="acl__stat-label">{s.label}</span>
            <span className="acl__stat-value">{s.value}</span>
            <span className="acl__stat-delta">{s.delta}</span>
          </div>
        ))}
      </section>

      {/* Tabla de clientes */}
      <section className="acl__panel">
        <div className="acl__toolbar">
          <div className="acl__search">
            <span className="acl__search-icon">🔍</span>
            <input
              className="acl__search-input"
              placeholder="Buscar cliente por nombre, correo o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="acl__toolbar-actions">
            <div className="acl__filter-wrap">
              <button className="ad__btn ad__btn--ghost" onClick={() => setFilterOpen((v) => !v)}>
                Filtrar{filter !== 'todos' ? `: ${FILTERS.find((f) => f.key === filter)?.label}` : ''} ▾
              </button>
              {filterOpen && (
                <div className="acl__filter-menu">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      className={`acl__filter-option ${filter === f.key ? 'is-active' : ''}`}
                      onClick={() => { setFilter(f.key); setFilterOpen(false); }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="ad__btn" onClick={() => { setForm({ name: '', email: '', phone: '' }); setErrors({}); setAddOpen(true); }}>
              + Nuevo cliente
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="acl__empty">
            {list.length === 0
              ? 'Este negocio aún no tiene clientes registrados.'
              : 'Ningún cliente coincide con la búsqueda.'}
          </p>
        ) : (
          <div className="acl__table-wrap">
            <table className="acl__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Reservas totales</th>
                  <th>Última visita</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <div className="acl__client">
                        <span className="acl__avatar">{c.initials}</span>
                        <div>
                          <span className="acl__client-name">{c.name}</span>
                          <span className="acl__client-email">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.reservations} {c.reservations === 1 ? 'reserva' : 'reservas'}</td>
                    <td>{c.lastVisit}</td>
                    <td>
                      <span className={`acl__badge ${c.active ? 'is-active' : 'is-inactive'}`}>
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <a href="#" className="acl__action" onClick={(e) => e.preventDefault()}>Ver</a>
                      <a href="#" className="acl__action" onClick={(e) => e.preventDefault()}>Editar</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="acl__foot">
          <span className="acl__count">
            Mostrando {filtered.length} de {total} {total === 1 ? 'cliente' : 'clientes'} de {bizName}
          </span>
        </div>
      </section>

      {/* Modal nuevo cliente */}
      <Modal open={addOpen} title="Nuevo cliente" onClose={() => setAddOpen(false)}>
        <div className="rv-form-field">
          <span className="rv-form-label">Nombre completo</span>
          <input className={`rv-form-input ${errors.name ? 'has-error' : ''}`} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          {errors.name && <span className="rv-form-error">{errors.name}</span>}
        </div>
        <div className="rv-form-field">
          <span className="rv-form-label">Correo</span>
          <input className={`rv-form-input ${errors.email ? 'has-error' : ''}`} type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          {errors.email && <span className="rv-form-error">{errors.email}</span>}
        </div>
        <div className="rv-form-field">
          <span className="rv-form-label">Teléfono</span>
          <input className={`rv-form-input ${errors.phone ? 'has-error' : ''}`} type="tel" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          {errors.phone && <span className="rv-form-error">{errors.phone}</span>}
        </div>
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setAddOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={submitNew}>Agregar cliente</button>
        </div>
      </Modal>

      <footer className="ad__footer">Clientes · 17/20</footer>
    </AdminLayout>
  );
}
