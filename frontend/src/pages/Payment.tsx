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

// --- Validación de tarjeta ---
// Algoritmo de Luhn: valida que el número de tarjeta sea plausible.
function luhnValid(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Agrupa el número de tarjeta en bloques de 4: "1234 5678 9012 3456"
function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// Formatea el vencimiento como MM/AA mientras se escribe.
function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

// El vencimiento (MM/AA) debe ser un mes válido y no estar vencido.
function expiryValid(v: string): boolean {
  const m = v.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const lastDay = new Date(year, month, 0); // último día del mes de vencimiento
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

type CardErrors = Partial<Record<'number' | 'expiry' | 'cvv' | 'holder', string>>;

// Pantalla 9/12 — Pago
export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { date?: string; time?: string } | null;
  const service = id ? serviceDetails[id] : undefined;

  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
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

  const validateCard = (): boolean => {
    const e: CardErrors = {};
    if (!luhnValid(card.number)) e.number = 'Número de tarjeta inválido.';
    if (!expiryValid(card.expiry)) e.expiry = 'Vencimiento inválido o tarjeta expirada.';
    if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = 'El CVV debe tener 3 o 4 dígitos.';
    if (card.holder.trim().length < 3) e.holder = 'Escribe el nombre del titular.';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    // Si paga con tarjeta, valida los datos antes de continuar.
    if (method === 'card' && !validateCard()) return;

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
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`py__input ${cardErrors.number ? 'has-error' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  />
                  {cardErrors.number && <span className="py__error">{cardErrors.number}</span>}
                </label>

                <label className="py__field">
                  <span className="py__field-label">Vencimiento</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`py__input ${cardErrors.expiry ? 'has-error' : ''}`}
                    placeholder="MM/AA"
                    value={card.expiry}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  />
                  {cardErrors.expiry && <span className="py__error">{cardErrors.expiry}</span>}
                </label>

                <label className="py__field">
                  <span className="py__field-label">CVV</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`py__input ${cardErrors.cvv ? 'has-error' : ''}`}
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                  {cardErrors.cvv && <span className="py__error">{cardErrors.cvv}</span>}
                </label>

                <label className="py__field">
                  <span className="py__field-label">Titular</span>
                  <input
                    type="text"
                    className={`py__input ${cardErrors.holder ? 'has-error' : ''}`}
                    placeholder="Nombre en tarjeta"
                    value={card.holder}
                    onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value }))}
                  />
                  {cardErrors.holder && <span className="py__error">{cardErrors.holder}</span>}
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
