import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { belongsToBusiness } from '../data/businesses';
import { payMethodShort, payStatusLabel } from '../data/payments';
import {
  rangePresets, rangeDates, buildReport, money, shortDate,
} from '../data/reportData';
import type { RangeKey } from '../data/reportData';
import '../styles/variables.css';
import './AdminReports.css';

const statusLabel = { confirmada: 'Confirmadas', pendiente: 'Pendientes', cancelada: 'Canceladas' } as const;

// Colores de las gráficas (validados para daltonismo; la leyenda siempre
// repite la etiqueta y el número, así el color nunca es el único dato).
const STATUS_COLORS = {
  confirmada: 'var(--rv-green)',
  pendiente: 'var(--rv-amber)',
  cancelada: 'var(--rv-red)',
} as const;
const METHOD_COLORS = ['#2A78D6', '#EB6834', '#1BAF7A'];

interface Slice { label: string; value: number; color: string }

// Gráfica de dona en SVG (sin librerías externas).
function Donut({ slices, value, unit }: { slices: Slice[]; value: string; unit: string }) {
  const total = slices.reduce((n, s) => n + s.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <svg viewBox="0 0 140 140" className="rp__donut" role="img" aria-label={`${value} ${unit}`}>
      <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F2F4" strokeWidth="20" />
      {total > 0 && slices.filter((s) => s.value > 0).map((s) => {
        const frac = s.value / total;
        // 3px de separación entre gajos: se distinguen aunque no se vea el color
        const len = Math.max(1, C * frac - 3);
        const arc = (
          <circle
            key={s.label}
            cx="70" cy="70" r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-C * acc}
            transform="rotate(-90 70 70)"
          >
            <title>{`${s.label}: ${s.value} (${Math.round(frac * 100)}%)`}</title>
          </circle>
        );
        acc += frac;
        return arc;
      })}
      <text x="70" y="68" textAnchor="middle" className="rp__donut-value">{value}</text>
      <text x="70" y="88" textAnchor="middle" className="rp__donut-unit">{unit}</text>
    </svg>
  );
}

// Leyenda de la dona: etiqueta + cantidad + porcentaje.
function Legend({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((n, s) => n + s.value, 0) || 1;
  return (
    <ul className="rp__legend">
      {slices.map((s) => (
        <li key={s.label} className="rp__legend-item">
          <span className="rp__legend-dot" style={{ background: s.color }} />
          <span className="rp__legend-label">{s.label}</span>
          <span className="rp__legend-value">
            {s.value} · {Math.round((s.value / total) * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

// Pantalla 21/21 — Panel Administrador (Reportes)
export default function AdminReports() {
  const { reservations } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;

  const [preset, setPreset] = useState<RangeKey>('mes');
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);

  // Modal de "Generar PDF"
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfOpts, setPdfOpts] = useState({ graficas: true, tabla: true, clientes: false });
  const [pdfAviso, setPdfAviso] = useState(false);

  const { from, to } = custom ?? rangeDates(preset);

  // Solo las reservas de ESTE negocio, dentro del periodo elegido.
  const report = useMemo(() => {
    const mine = reservations.filter((r) => belongsToBusiness(r.serviceId, bizId));
    return buildReport(mine, from, to);
  }, [reservations, bizId, from, to]);

  const setDate = (campo: 'from' | 'to', valor: string) =>
    setCustom((c) => ({ ...(c ?? { from, to }), [campo]: valor }));

  const maxBucket = Math.max(1, ...report.buckets.map((b) => b.count));
  // Con muchos días no cabe una etiqueta por barra: se muestra una de cada N.
  const labelStep = Math.ceil(report.buckets.length / 12);
  const topServices = report.byService.slice(0, 6);
  const maxService = Math.max(1, ...topServices.map((s) => s.revenue));

  const statusSlices: Slice[] = (['confirmada', 'pendiente', 'cancelada'] as const).map((k) => ({
    label: statusLabel[k],
    value: report.byStatus[k],
    color: STATUS_COLORS[k],
  }));
  const methodSlices: Slice[] = report.byMethod.map((m, i) => ({
    label: payMethodShort[m.method],
    value: m.count,
    color: METHOD_COLORS[i % METHOD_COLORS.length],
  }));

  const kpis = [
    { label: 'Reservas', value: String(report.total), hint: `${report.byStatus.confirmada} confirmadas` },
    { label: 'Ingresos', value: money(report.revenue), hint: `${money(report.collected)} ya cobrado` },
    { label: 'Por cobrar', value: money(report.pending), hint: 'Pago en el lugar' },
    { label: 'Ticket promedio', value: money(report.ticket), hint: `Horario pico ${report.peakHour}` },
    { label: 'Clientes', value: String(report.clients), hint: 'Distintos en el periodo' },
    { label: 'Cancelación', value: `${report.cancelRate}%`, hint: `${money(report.lost)} no cobrados` },
  ];

  // Genera el PDF del reporte.
  // TODO(backend): descargar el archivo desde la API del negocio, algo como
  //   GET /api/negocios/:id/reportes/pdf?desde=&hasta=&graficas=&tabla=&clientes=
  // Aquí solo queda lista la pantalla; la generación se hace en la rama de back.
  const generarPdf = () => setPdfAviso(true);

  return (
    <AdminLayout>
      <header className="ad__header">
        <div>
          <h1 className="ad__title">Reportes</h1>
          <p className="rp__subtitle">
            {shortDate(from)} — {shortDate(to)} · {report.total} reservas
          </p>
        </div>
        <button
          className="ad__btn"
          onClick={() => { setPdfAviso(false); setPdfOpen(true); }}
        >
          📄 Generar PDF
        </button>
      </header>

      {/* ---- Periodo del reporte ---- */}
      <section className="ad__panel rp__filters">
        <div className="rp__presets">
          {rangePresets.map((p) => (
            <button
              key={p.key}
              className={`rp__preset ${!custom && preset === p.key ? 'is-active' : ''}`}
              onClick={() => { setPreset(p.key); setCustom(null); }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="rp__dates">
          <label className="rp__date">
            <span className="rp__date-label">Desde</span>
            <input type="date" className="rp__date-input" value={from}
              onChange={(e) => setDate('from', e.target.value)} />
          </label>
          <label className="rp__date">
            <span className="rp__date-label">Hasta</span>
            <input type="date" className="rp__date-input" value={to}
              onChange={(e) => setDate('to', e.target.value)} />
          </label>
        </div>
      </section>

      {/* ---- Indicadores del periodo ---- */}
      <section className="rp__kpis">
        {kpis.map((k) => (
          <div key={k.label} className="rp__kpi">
            <span className="rp__kpi-label">{k.label}</span>
            <span className="rp__kpi-value">{k.value}</span>
            <span className="rp__kpi-hint">{k.hint}</span>
          </div>
        ))}
      </section>

      {/* ---- Reservas en el tiempo ---- */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">Reservas por {report.bucketUnit}</h2>
          <span className="rp__panel-note">Sin contar canceladas</span>
        </div>
        {report.total === 0 ? (
          <p className="ad__empty">No hay reservas en este periodo.</p>
        ) : (
          <div className="rp__bars">
            {report.buckets.map((b, i) => (
              <div key={b.key} className="rp__bar-col">
                <div className="rp__bar-track">
                  <div
                    className="rp__bar"
                    style={{ height: `${(b.count / maxBucket) * 100}%` }}
                  />
                  <span className="rp__tip">
                    {b.count} {b.count === 1 ? 'reserva' : 'reservas'} · {money(b.revenue)}
                  </span>
                </div>
                <span className="rp__bar-label">
                  {i % labelStep === 0 ? b.label : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Dos gráficas de composición ---- */}
      <div className="rp__grid">
        <section className="ad__panel">
          <div className="ad__panel-head">
            <h2 className="ad__panel-title">Estado de las reservas</h2>
          </div>
          {report.total === 0 ? (
            <p className="ad__empty">Sin datos en este periodo.</p>
          ) : (
            <div className="rp__donut-row">
              <Donut slices={statusSlices} value={String(report.total)} unit="reservas" />
              <Legend slices={statusSlices} />
            </div>
          )}
        </section>

        <section className="ad__panel">
          <div className="ad__panel-head">
            <h2 className="ad__panel-title">Método de pago</h2>
          </div>
          {methodSlices.length === 0 ? (
            <p className="ad__empty">Sin datos en este periodo.</p>
          ) : (
            <div className="rp__donut-row">
              <Donut
                slices={methodSlices}
                value={String(methodSlices.reduce((n, s) => n + s.value, 0))}
                unit="pagos"
              />
              <div>
                <Legend slices={methodSlices} />
                <p className="rp__note">Por cobrar en el lugar: {money(report.pending)}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ---- Ingresos por servicio ---- */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">Ingresos por servicio</h2>
          <span className="rp__panel-note">Top {topServices.length}</span>
        </div>
        {topServices.length === 0 ? (
          <p className="ad__empty">Sin ingresos en este periodo.</p>
        ) : (
          <ul className="rp__hbars">
            {topServices.map((s) => (
              <li key={s.name} className="rp__hbar">
                <span className="rp__hbar-name">{s.name}</span>
                <span className="rp__hbar-track">
                  <span className="rp__hbar-fill" style={{ width: `${(s.revenue / maxService) * 100}%` }} />
                </span>
                <span className="rp__hbar-value">
                  {money(s.revenue)} <em>({s.count})</em>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Detalle (lo mismo que llevará la tabla del PDF) ---- */}
      <section className="ad__panel">
        <div className="ad__panel-head">
          <h2 className="ad__panel-title">Detalle de reservas</h2>
          <span className="rp__panel-note">{report.rows.length} en el periodo</span>
        </div>
        {report.rows.length === 0 ? (
          <p className="ad__empty">No hay reservas en este periodo.</p>
        ) : (
          <>
            <div className="rp__table-wrap">
              <table className="rp__table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th className="rp__num">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.slice(0, 12).map((r) => (
                    <tr key={r.id}>
                      <td>{shortDate(r.date)} · {r.time}</td>
                      <td>{r.customerName}</td>
                      <td>{r.serviceName}</td>
                      <td>
                        <span className={`rp__badge rp__badge--${r.status}`}>{r.status}</span>
                      </td>
                      <td>
                        {r.payStatus ? payStatusLabel[r.payStatus] : '—'}
                        {r.payMethod ? ` · ${payMethodShort[r.payMethod]}` : ''}
                      </td>
                      <td className="rp__num">{money(r.total ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.rows.length > 12 && (
              <p className="rp__more">
                y {report.rows.length - 12} reservas más — el PDF incluye el listado completo.
              </p>
            )}
          </>
        )}
      </section>

      {/* ---- Modal: generar el PDF ---- */}
      <Modal open={pdfOpen} title="Generar reporte PDF" onClose={() => setPdfOpen(false)} width={520}>
        <p className="rp__modal-text">
          Se generará el reporte de <strong>{user?.name ?? 'tu negocio'}</strong> del
          {' '}<strong>{shortDate(from)}</strong> al <strong>{shortDate(to)}</strong>,
          con {report.total} reservas e ingresos por {money(report.revenue)}.
        </p>

        <div className="rp__opts">
          {([
            ['graficas', 'Incluir gráficas'],
            ['tabla', 'Incluir tabla de reservas'],
            ['clientes', 'Incluir datos de contacto de los clientes'],
          ] as const).map(([key, label]) => (
            <label key={key} className="rp__opt">
              <input
                type="checkbox"
                checked={pdfOpts[key]}
                onChange={(e) => setPdfOpts((o) => ({ ...o, [key]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {pdfAviso && (
          <div className="rp__aviso">
            <strong>Falta conectar el servidor.</strong> El archivo se arma en el
            backend (ruta <code>/reportes/pdf</code>) y todavía no está publicado.
            La pantalla ya envía el periodo y las opciones elegidas.
          </div>
        )}

        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setPdfOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={generarPdf}>Generar PDF</button>
        </div>
      </Modal>

      <footer className="ad__footer">Panel Administrador · Reportes</footer>
    </AdminLayout>
  );
}
