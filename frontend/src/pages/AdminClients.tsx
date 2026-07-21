import AdminLayout from '../components/AdminLayout';
import { calendarEvents, clients as mockClients } from '../data/adminData';
import { businessInitials } from '../data/businesses';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminClients.css';

// Correo de ejemplo a partir del nombre (quita acentos con escapes unicode).
const emailFor = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.') + '@correo.com';

// Pantalla 17/20 — Clientes (Panel Administrador) · por negocio
export default function AdminClients() {
  const { reservations } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;
  const bizName = user?.name;

  // Clientes de ESTE negocio: los de la agenda + los que ya reservaron.
  const names = Array.from(new Set([
    ...calendarEvents.filter((e) => !bizName || e.service === bizName).map((e) => e.client),
    ...reservations.filter((r) => !bizId || r.serviceId === bizId).map((r) => r.customerName),
  ]));

  const list = names.map((name) => {
    const mock = mockClients.find((c) => c.name === name);
    const bookedHere = reservations.filter(
      (r) => r.serviceId === bizId && r.customerName === name && r.status !== 'cancelada',
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

  const total = list.length;
  const recurrentes = list.filter((c) => c.reservations > 1).length;
  const stats = [
    { label: 'Clientes del negocio', value: String(total),        delta: 'este negocio' },
    { label: 'Recurrentes',          value: String(recurrentes),  delta: '2+ reservas' },
    { label: 'Nuevos',               value: String(total - recurrentes), delta: '1 reserva' },
  ];

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
            <input className="acl__search-input" placeholder="Buscar cliente por nombre, correo o teléfono..." />
          </div>
          <div className="acl__toolbar-actions">
            <button className="ad__btn ad__btn--ghost">Filtrar</button>
            <button className="ad__btn">+ Nuevo cliente</button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="acl__empty">Este negocio aún no tiene clientes registrados.</p>
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
                {list.map((c) => (
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
          <span className="acl__count">Mostrando {total} {total === 1 ? 'cliente' : 'clientes'} de {bizName}</span>
        </div>
      </section>

      <footer className="ad__footer">Clientes · 17/20</footer>
    </AdminLayout>
  );
}
