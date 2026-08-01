import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { serviceDetails } from '../data/serviceDetailData';
import { bookingTotal, priceNote } from '../data/bookingModes';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { luhnValid, formatCardNumber, formatExpiry, expiryValid } from '../utils/card';
import { formatDateLabel, nightsBetween } from '../utils/datetime';
import { payMethods, payMethodLabels, payStatusFor } from '../data/payments';
import type { PayMethod } from '../data/payments';
import '../styles/variables.css';
import './Payment.css';

const formatDate = formatDateLabel;

type CardErrors = Partial<Record<'number' | 'expiry' | 'cvv' | 'holder', string>>;

// Pantalla 9/12 — Pago
export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    { date?: string; time?: string; checkOut?: string; people?: number } | null;
  const service = id ? serviceDetails[id] : undefined;

  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const { book, getServiceBooking } = useStore();
  const { user } = useAuth();

  const cfg = getServiceBooking(id ?? '');
  const mode = cfg.mode;
  const date = state?.date ?? '';
  const checkOut = state?.checkOut ?? '';
  const people = state?.people ?? 1;
  const time = state?.time ?? (mode === 'dia' ? cfg.checkInTime : '');
  const nights = mode === 'dia' ? nightsBetween(date, checkOut) : 0;

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

  const total = bookingTotal(mode, service.price, { nights, people });
  // Pagar en el lugar no cobra nada ahora: la reserva queda con pago pendiente.
  const payStatus = payStatusFor(method);
  const payLater = payStatus === 'pendiente';

  const handlePay = () => {
    // Si paga con tarjeta, valida los datos antes de continuar.
    if (method === 'card' && !validateCard()) return;

    // Registra la reserva (queda pendiente hasta que el negocio la acepte).
    // book() devuelve false si ya no queda espacio, habitación o mesa.
    const ok = book({
      serviceId: service.id,
      serviceName: service.name,
      image: service.image,
      address: service.address,
      date,
      dateLabel: formatDate(date),
      time,
      customerName: user?.name ?? 'Cliente',
      mode,
      people,
      total,
      payMethod: method,
      payStatus,
      ...(mode === 'dia' && {
        checkOut,
        checkOutLabel: formatDate(checkOut),
        checkOutTime: cfg.checkOutTime,
        nights,
      }),
    });

    if (!ok) {
      if (mode === 'dia') {
        alert('Lo sentimos, ya no hay habitaciones libres en esas fechas. Elige otras.');
        navigate(`/reservar/${id}/fecha`);
      } else if (mode === 'mesa') {
        alert(`Lo sentimos, ya no hay mesas para ${people} personas en ese horario. Elige otro.`);
        navigate(`/reservar/${id}/horario`, { state: { date, people } });
      } else {
        alert(mode === 'evento'
          ? 'Lo sentimos, ese turno se acaba de apartar. Elige otro.'
          : 'Lo sentimos, ese horario se acaba de llenar. Elige otro.');
        navigate(`/reservar/${id}/horario`, { state: { date, people } });
      }
      return;
    }
    navigate(`/reservar/${id}/exito`, { state: { date, time, checkOut, people } });
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
              {payMethods.map((m) => (
                <label
                  key={m}
                  className={`py__method ${method === m ? 'is-selected' : ''}`}
                >
                  <span className="py__method-dot" />
                  <span className="py__method-label">{payMethodLabels[m]}</span>
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

            {/* Aviso de pago en el lugar / badge SSL */}
            {payLater ? (
              <div className="py__pending">
                <span className="py__pending-title">Pago pendiente</span>
                <span className="py__pending-text">
                  No se te cobra nada ahora. Pagarás ${total} directamente en el
                  negocio; tu reserva queda registrada con el pago pendiente.
                </span>
              </div>
            ) : (
              <div className="py__ssl">
                <span className="py__ssl-dot" />
                Pago seguro y cifrado con SSL
              </div>
            )}

            {/* Botón de confirmar: solo cobra si el pago es en línea */}
            <button className="py__pay-btn" onClick={handlePay}>
              {payLater
                ? `Confirmar reserva — pago pendiente $${total}`
                : `Pagar ahora — $${total}`}
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
                <span className="py__summary-desc">
                  {mode === 'dia'
                    ? `${formatDate(date)} → ${formatDate(checkOut)}`
                    : `${formatDate(date)} · ${time}`}
                </span>
                {mode === 'dia' && (
                  <span className="py__summary-desc">
                    {nights} {nights === 1 ? 'noche' : 'noches'} · {people} {people === 1 ? 'huésped' : 'huéspedes'}
                  </span>
                )}
                {mode === 'mesa' && (
                  <span className="py__summary-desc">Mesa para {people} {people === 1 ? 'persona' : 'personas'}</span>
                )}
                {mode === 'cupo' && (
                  <span className="py__summary-desc">{people} {people === 1 ? 'lugar' : 'lugares'}</span>
                )}
                {mode === 'evento' && (
                  <span className="py__summary-desc">Salón completo · {people} {people === 1 ? 'invitado' : 'invitados'}</span>
                )}
              </div>
            </div>

            <div className="py__summary-rows">
              <div className="py__summary-row">
                <span>
                  ${service.price} {priceNote(mode)}
                  {mode === 'dia' && ` × ${nights}`}
                  {(mode === 'cupo' || mode === 'mesa' || mode === 'evento') && ` × ${people}`}
                </span>
                <span>${total}</span>
              </div>
              <div className="py__summary-row">
                <span>Descuento</span>
                <span>-$0</span>
              </div>
              <div className="py__summary-row py__summary-row--total">
                <span>{payLater ? 'Total a pagar en el lugar' : 'Total'}</span>
                <span>${total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py__footer">reservapp.com/reservar/pago</footer>
    </div>
  );
}
