import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './Payment.css';

type PayMethod = 'card' | 'paypal' | 'local';

const methodLabels: Record<PayMethod, string> = {
  card: 'Tarjeta de crédito',
  paypal: 'PayPal',
  local: 'Pagar en el lugar',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Pantalla 9/12 — Pago
export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string; time?: string } | null;
  const service = id ? serviceDetails[id] : undefined;

  const [method, setMethod] = useState<PayMethod>('card');
  const { book } = useStore();
  const { user } = useAuth();

  if (!service) {
    return (
      <div className="py">
        <Navbar active="Reservas" />
        <main className="py__container"><p>Servicio no encontrado.</p></main>
      </div>
    );
  }

  const handlePay = () => {
    const date = state?.date ?? '';
    const time = state?.time ?? '';
    // Registra la reserva (queda pendiente hasta que el negocio la acepte).
    // book() devuelve false si el horario ya se llenó.
    const ok = book({
      serviceId: service.id,
      serviceName: service.name,
      image: service.image,
      address: service.address,
      date,
      dateLabel: formatDate(date),
      time,
      customerName: user?.name ?? 'Cliente',
    });
    if (!ok) {
      alert('Lo sentimos, ese horario se acaba de llenar. Elige otro.');
      navigate(`/reservar/${id}/horario`, { state: { date } });
      return;
    }
    navigate(`/reservar/${id}/exito`, { state: { date, time } });
  };

  return (
    <div className="py">
      <Navbar active="Reservas" />

      <main className="py__container">
        <div className="py__layout">
          {/* Columna izquierda — Método de pago */}
          <div className="py__card">
            <h2 className="py__heading">Método de pago</h2>

            {/* Selector de método */}
            <div className="py__methods">
              {(Object.keys(methodLabels) as PayMethod[]).map((m) => (
                <label
                  key={m}
                  className={`py__method ${method === m ? 'is-selected' : ''}`}
                >
                  <span className="py__method-dot" />
                  <span className="py__method-label">{methodLabels[m]}</span>
                  <input
                    type="radio"
                    name="method"
                    className="py__method-radio"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                </label>
              ))}
            </div>

            {/* Formulario de tarjeta (visible solo si method === card) */}
            {method === 'card' && (
              <div className="py__form">
                <h3 className="py__form-title">Datos de la tarjeta</h3>

                <label className="py__field">
                  <span className="py__field-label">Número de tarjeta</span>
                  <input type="text" className="py__input" placeholder="1234 5678 9012 3456" />
                </label>

                <label className="py__field">
                  <span className="py__field-label">Vencimiento</span>
                  <input type="text" className="py__input" placeholder="MM/AA" />
                </label>

                <label className="py__field">
                  <span className="py__field-label">CVV</span>
                  <input type="text" className="py__input" placeholder="CVV" />
                </label>

                <label className="py__field">
                  <span className="py__field-label">Titular</span>
                  <input type="text" className="py__input" placeholder="Nombre en tarjeta" />
                </label>
              </div>
            )}

            {/* Badge SSL */}
            <div className="py__ssl">
              <span className="py__ssl-dot" />
              Pago seguro y cifrado con SSL
            </div>

            {/* Botón pagar */}
            <button className="py__pay-btn" onClick={handlePay}>
              Pagar ahora — ${service.price}
            </button>
          </div>

          {/* Columna derecha — Resumen del pedido */}
          <div className="py__card py__summary">
            <h2 className="py__heading">Resumen del pedido</h2>

            <div className="py__summary-header">
              <div
                className="py__summary-img"
                style={{ backgroundImage: `url(${service.image})` }}
              />
              <div className="py__summary-info">
                <span className="py__summary-name">{service.name}</span>
                <span className="py__summary-desc">Corte profesional</span>
              </div>
            </div>

            <div className="py__summary-rows">
              <div className="py__summary-row">
                <span>Subtotal</span>
                <span>${service.price}</span>
              </div>
              <div className="py__summary-row">
                <span>Descuento</span>
                <span>-$0</span>
              </div>
              <div className="py__summary-row py__summary-row--total">
                <span>Total</span>
                <span>${service.price}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py__footer">reservvap.com/reservar/pago</footer>
    </div>
  );
}
