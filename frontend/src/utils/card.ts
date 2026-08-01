// Validación y formato de tarjetas, compartido por el pago y por los
// métodos de pago guardados en el perfil.

// Algoritmo de Luhn: valida que el número de tarjeta sea plausible.
export function luhnValid(num: string): boolean {
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
export function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// Formatea el vencimiento como MM/AA mientras se escribe.
export function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

// El vencimiento (MM/AA) debe ser un mes válido y no estar vencido.
export function expiryValid(v: string): boolean {
  const m = v.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const lastDay = new Date(year, month, 0);
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Deduce la marca a partir del primer dígito (aproximado, suficiente para la maqueta).
export function cardBrand(num: string): string {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^6/.test(d)) return 'Discover';
  return 'Tarjeta';
}

// Últimos 4 dígitos.
export function lastFour(num: string): string {
  return num.replace(/\D/g, '').slice(-4);
}
