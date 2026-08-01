// Integración con WhatsApp.
//
// Por ahora abrimos el chat de WhatsApp con un enlace wa.me (click-to-chat),
// que funciona sin backend. Cuando exista la API (WhatsApp Cloud API de Meta),
// basta con reemplazar el cuerpo de `sendWhatsAppMessage` por una llamada
// POST a nuestro backend (FastAPI) hacia:
//   https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/messages
// enviando { messaging_product: 'whatsapp', to, type: 'text', text: { body } }
// con el token de acceso en el header Authorization.

// Normaliza a solo dígitos con código de país (México por defecto: 52).
export function normalizePhone(phone: string, countryCode = '52'): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Si ya trae código de país (12+ dígitos), se respeta; si no, se antepone.
  return digits.length > 10 ? digits : countryCode + digits;
}

// Construye el enlace wa.me con un mensaje opcional prellenado.
export function waLink(phone: string, message = ''): string {
  const to = normalizePhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${to}${text}`;
}

// Abre WhatsApp con el mensaje prellenado. Devuelve false si no hay teléfono.
export function sendWhatsAppMessage(phone: string, message = ''): boolean {
  if (!phone) return false;
  window.open(waLink(phone, message), '_blank', 'noopener,noreferrer');
  return true;
}
