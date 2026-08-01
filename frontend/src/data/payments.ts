// Métodos de pago del flujo de reserva.
// El método elegido viaja dentro de la reserva para que el negocio sepa
// qué ya está cobrado y qué se cobra al llegar (pago en el lugar).

export type PayMethod = 'card' | 'paypal' | 'local';
export type PayStatus = 'pagado' | 'pendiente';

export const payMethods: PayMethod[] = ['card', 'paypal', 'local'];

// Etiqueta completa (pantalla de pago).
export const payMethodLabels: Record<PayMethod, string> = {
  card: 'Tarjeta de crédito',
  paypal: 'PayPal',
  local: 'Pagar en el lugar',
};

// Etiqueta corta (tablas, gráficas y badges del panel).
export const payMethodShort: Record<PayMethod, string> = {
  card: 'Tarjeta',
  paypal: 'PayPal',
  local: 'En el lugar',
};

export const payStatusLabel: Record<PayStatus, string> = {
  pagado: 'Pagado',
  pendiente: 'Pago pendiente',
};

// Quien paga en el lugar deja la reserva con el cobro pendiente;
// tarjeta y PayPal se cobran al momento.
export const payStatusFor = (method: PayMethod): PayStatus =>
  (method === 'local' ? 'pendiente' : 'pagado');
