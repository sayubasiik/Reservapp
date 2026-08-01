import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import type { SavedAddress, SavedCard, NotificationPrefs } from '../auth/AuthContext';
import { DEFAULT_NOTIFICATIONS } from '../auth/AuthContext';
import { userProfile } from '../data/exploreData';
import { readImageFile } from '../utils/image';
import { luhnValid, formatCardNumber, formatExpiry, expiryValid, cardBrand, lastFour } from '../utils/card';
import { businessInitials } from '../data/businesses';
import '../styles/variables.css';
import './Profile.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Panel = 'personal' | 'cards' | 'notifications' | 'addresses' | 'help' | 'terms' | null;

const notifLabels: Record<keyof NotificationPrefs, string> = {
  reservations: 'Confirmaciones y cambios de reserva',
  reminders: 'Recordatorios antes de la cita',
  promotions: 'Ofertas y novedades',
  email: 'Enviarme copia por correo',
};

// Pantalla 15/20 — Perfil
export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  const name = user?.name ?? userProfile.name;
  const initials = user?.initials ?? userProfile.initials;
  const email = user?.email ?? userProfile.email;
  const phone = user?.phone ?? userProfile.phone;
  const avatar = user?.avatar;
  const addresses = user?.addresses ?? [];
  const cards = user?.cards ?? [];
  const notifications = user?.notifications ?? DEFAULT_NOTIFICATIONS;

  const menu: { key: Panel; icon: string; label: string }[] = [
    { key: 'personal', icon: '👤', label: 'Mis datos personales' },
    { key: 'cards', icon: '💳', label: 'Métodos de pago' },
    { key: 'notifications', icon: '🔔', label: 'Notificaciones' },
    { key: 'addresses', icon: '📍', label: 'Direcciones guardadas' },
    { key: 'help', icon: '❓', label: 'Ayuda y soporte' },
    { key: 'terms', icon: '📄', label: 'Términos y condiciones' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Foto de perfil ---
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError(null);
    try {
      const dataUrl = await readImageFile(file);
      updateUser({ avatar: dataUrl });
    } catch (err) {
      setImgError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    }
    e.target.value = '';
  };

  return (
    <div className="pf">
      <Navbar active="Perfil" userInitials={initials} />

      <main className="pf__container">
        {/* Cabecera del usuario */}
        <section className="pf__header">
          <div className="pf__avatar-wrap">
            {avatar ? (
              <img className="pf__avatar pf__avatar--img" src={avatar} alt={name} />
            ) : (
              <div className="pf__avatar">{initials}</div>
            )}
            <button
              className="pf__avatar-btn"
              onClick={() => fileRef.current?.click()}
              aria-label="Cambiar foto de perfil"
            >
              📷
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickImage}
            />
          </div>
          <div className="pf__ident">
            <h1 className="pf__name">{name}</h1>
            <p className="pf__contact">{email}</p>
            <p className="pf__contact">{phone}</p>
            {imgError && <p className="pf__img-error">{imgError}</p>}
          </div>
          <button className="pf__edit" onClick={() => setPanel('personal')}>✎ Editar perfil</button>
        </section>

        {/* Estadísticas */}
        <section className="pf__stats">
          <div className="pf__stat">
            <span className="pf__stat-value">{userProfile.totalReservations}</span>
            <span className="pf__stat-label">Reservas totales</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{cards.length}</span>
            <span className="pf__stat-label">Métodos de pago</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{addresses.length}</span>
            <span className="pf__stat-label">Direcciones</span>
          </div>
        </section>

        {/* Menú de opciones */}
        <section className="pf__menu">
          {menu.map((item) => (
            <button key={item.label} className="pf__menu-item" onClick={() => setPanel(item.key)}>
              <span className="pf__menu-icon">{item.icon}</span>
              <span className="pf__menu-label">{item.label}</span>
              <span className="pf__menu-chevron">›</span>
            </button>
          ))}
        </section>

        {/* Cerrar sesión */}
        <button className="pf__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </main>

      {/* ---- Modales de cada sección ---- */}
      <PersonalDataModal
        open={panel === 'personal'}
        onClose={() => setPanel(null)}
        initial={{ name, email, phone }}
        onSave={(data) => {
          updateUser({ ...data, initials: businessInitials(data.name) });
          setPanel(null);
        }}
      />

      <CardsModal
        open={panel === 'cards'}
        onClose={() => setPanel(null)}
        cards={cards}
        onChange={(next) => updateUser({ cards: next })}
      />

      <NotificationsModal
        open={panel === 'notifications'}
        onClose={() => setPanel(null)}
        prefs={notifications}
        onChange={(next) => updateUser({ notifications: next })}
      />

      <AddressesModal
        open={panel === 'addresses'}
        onClose={() => setPanel(null)}
        addresses={addresses}
        onChange={(next) => updateUser({ addresses: next })}
      />

      <Modal open={panel === 'help'} title="Ayuda y soporte" onClose={() => setPanel(null)}>
        <p className="pf__help-lead">¿Necesitas ayuda? Estamos para apoyarte.</p>
        <ul className="pf__help-list">
          <li>📧 Correo: <strong>soporte@reservvap.com</strong></li>
          <li>📞 Teléfono: <strong>(55) 8000 1234</strong></li>
          <li>💬 WhatsApp: <strong>+52 55 8000 1234</strong></li>
          <li>🕐 Horario: Lun a Vie, 9:00 – 18:00</li>
        </ul>
        <p className="pf__help-faq-title">Preguntas frecuentes</p>
        <details className="pf__faq"><summary>¿Cómo modifico una reserva?</summary><p>Ve a “Reservas”, elige la cita y toca “Modificar”.</p></details>
        <details className="pf__faq"><summary>¿Cómo cancelo una reserva?</summary><p>En “Reservas” toca “Cancelar”. El negocio recibirá el aviso.</p></details>
        <details className="pf__faq"><summary>¿Es seguro pagar en la app?</summary><p>Sí, los pagos se procesan cifrados con SSL.</p></details>
      </Modal>

      <Modal open={panel === 'terms'} title="Términos y condiciones" onClose={() => setPanel(null)}>
        <div className="pf__terms">
          <p>Al usar ReservVap aceptas los siguientes términos:</p>
          <p><strong>1. Uso del servicio.</strong> ReservVap conecta a clientes con negocios para agendar citas. El negocio es responsable del servicio prestado.</p>
          <p><strong>2. Reservas.</strong> Una reserva queda sujeta a la disponibilidad y aceptación del negocio. Puedes modificarla o cancelarla desde la app.</p>
          <p><strong>3. Pagos.</strong> Los pagos con tarjeta se procesan de forma segura. Las políticas de reembolso dependen de cada negocio.</p>
          <p><strong>4. Datos personales.</strong> Tus datos se usan únicamente para gestionar tus reservas conforme a nuestra política de privacidad.</p>
          <p><strong>5. Conducta.</strong> No está permitido usar la plataforma para fines fraudulentos o ilícitos.</p>
          <p className="pf__terms-foot">Última actualización: julio 2026.</p>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================
   Modal: Mis datos personales / Editar perfil
   ========================================================= */
function PersonalDataModal({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: { name: string; email: string; phone: string };
  onSave: (data: { name: string; email: string; phone: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reinicia el formulario cada vez que se abre.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setName(initial.name); setEmail(initial.email); setPhone(initial.phone); setErrors({});
  }
  if (!open && wasOpen) setWasOpen(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Escribe tu nombre.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Correo con formato inválido.';
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'El teléfono debe tener al menos 10 dígitos.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  return (
    <Modal open={open} title="Mis datos personales" onClose={onClose}>
      <div className="rv-form-field">
        <span className="rv-form-label">Nombre completo</span>
        <input className={`rv-form-input ${errors.name ? 'has-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <span className="rv-form-error">{errors.name}</span>}
      </div>
      <div className="rv-form-field">
        <span className="rv-form-label">Correo electrónico</span>
        <input className={`rv-form-input ${errors.email ? 'has-error' : ''}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <span className="rv-form-error">{errors.email}</span>}
      </div>
      <div className="rv-form-field">
        <span className="rv-form-label">Teléfono</span>
        <input className={`rv-form-input ${errors.phone ? 'has-error' : ''}`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {errors.phone && <span className="rv-form-error">{errors.phone}</span>}
      </div>
      <div className="rv-form-actions">
        <button className="rv-btn rv-btn--ghost" onClick={onClose}>Cancelar</button>
        <button className="rv-btn" onClick={submit}>Guardar</button>
      </div>
    </Modal>
  );
}

/* =========================================================
   Modal: Métodos de pago
   ========================================================= */
function CardsModal({
  open, onClose, cards, onChange,
}: {
  open: boolean;
  onClose: () => void;
  cards: SavedCard[];
  onChange: (next: SavedCard[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ number: '', expiry: '', holder: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const startAdd = () => { setAdding(true); setForm({ number: '', expiry: '', holder: '' }); setErrors({}); };

  const addCard = () => {
    const e: Record<string, string> = {};
    if (!luhnValid(form.number)) e.number = 'Número de tarjeta inválido.';
    if (!expiryValid(form.expiry)) e.expiry = 'Vencimiento inválido o vencido.';
    if (form.holder.trim().length < 3) e.holder = 'Escribe el nombre del titular.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const card: SavedCard = {
      id: `c-${Date.now()}`,
      brand: cardBrand(form.number),
      last4: lastFour(form.number),
      holder: form.holder.trim(),
      expiry: form.expiry,
    };
    onChange([...cards, card]);
    setAdding(false);
  };

  return (
    <Modal open={open} title="Métodos de pago" onClose={onClose}>
      {cards.length === 0 && !adding && <p className="pf__empty">Aún no tienes métodos de pago guardados.</p>}

      <div className="pf__cards">
        {cards.map((c) => (
          <div key={c.id} className="pf__card-row">
            <span className="pf__card-brand">💳 {c.brand}</span>
            <span className="pf__card-num">•••• {c.last4}</span>
            <span className="pf__card-exp">{c.expiry}</span>
            <button className="pf__row-remove" onClick={() => onChange(cards.filter((x) => x.id !== c.id))} aria-label="Eliminar tarjeta">🗑</button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="pf__add-form">
          <div className="rv-form-field">
            <span className="rv-form-label">Número de tarjeta</span>
            <input className={`rv-form-input ${errors.number ? 'has-error' : ''}`} inputMode="numeric" placeholder="1234 5678 9012 3456"
              value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: formatCardNumber(e.target.value) }))} />
            {errors.number && <span className="rv-form-error">{errors.number}</span>}
          </div>
          <div className="rv-form-field">
            <span className="rv-form-label">Vencimiento</span>
            <input className={`rv-form-input ${errors.expiry ? 'has-error' : ''}`} inputMode="numeric" placeholder="MM/AA"
              value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }))} />
            {errors.expiry && <span className="rv-form-error">{errors.expiry}</span>}
          </div>
          <div className="rv-form-field">
            <span className="rv-form-label">Titular</span>
            <input className={`rv-form-input ${errors.holder ? 'has-error' : ''}`} placeholder="Nombre en la tarjeta"
              value={form.holder} onChange={(e) => setForm((f) => ({ ...f, holder: e.target.value }))} />
            {errors.holder && <span className="rv-form-error">{errors.holder}</span>}
          </div>
          <div className="rv-form-actions">
            <button className="rv-btn rv-btn--ghost" onClick={() => setAdding(false)}>Cancelar</button>
            <button className="rv-btn" onClick={addCard}>Agregar tarjeta</button>
          </div>
        </div>
      ) : (
        <button className="pf__add-btn" onClick={startAdd}>+ Agregar método de pago</button>
      )}
    </Modal>
  );
}

/* =========================================================
   Modal: Notificaciones
   ========================================================= */
function NotificationsModal({
  open, onClose, prefs, onChange,
}: {
  open: boolean;
  onClose: () => void;
  prefs: NotificationPrefs;
  onChange: (next: NotificationPrefs) => void;
}) {
  const keys = Object.keys(notifLabels) as (keyof NotificationPrefs)[];
  return (
    <Modal open={open} title="Notificaciones" onClose={onClose}>
      <div className="pf__toggles">
        {keys.map((k) => (
          <label key={k} className="pf__toggle-row">
            <span className="pf__toggle-label">{notifLabels[k]}</span>
            <button
              type="button"
              className={`pf__switch ${prefs[k] ? 'is-on' : ''}`}
              onClick={() => onChange({ ...prefs, [k]: !prefs[k] })}
              aria-label={notifLabels[k]}
            >
              <span className="pf__switch-knob" />
            </button>
          </label>
        ))}
      </div>
      <div className="rv-form-actions">
        <button className="rv-btn" onClick={onClose}>Listo</button>
      </div>
    </Modal>
  );
}

/* =========================================================
   Modal: Direcciones guardadas
   ========================================================= */
function AddressesModal({
  open, onClose, addresses, onChange,
}: {
  open: boolean;
  onClose: () => void;
  addresses: SavedAddress[];
  onChange: (next: SavedAddress[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', address: '' });
  const [error, setError] = useState<string | null>(null);

  const addAddress = () => {
    if (!form.label.trim() || !form.address.trim()) { setError('Completa el nombre y la dirección.'); return; }
    onChange([...addresses, { id: `a-${Date.now()}`, label: form.label.trim(), address: form.address.trim() }]);
    setForm({ label: '', address: '' });
    setAdding(false);
    setError(null);
  };

  return (
    <Modal open={open} title="Direcciones guardadas" onClose={onClose}>
      {addresses.length === 0 && !adding && <p className="pf__empty">Aún no tienes direcciones guardadas.</p>}

      <div className="pf__addresses">
        {addresses.map((a) => (
          <div key={a.id} className="pf__address-row">
            <span className="pf__address-icon">📍</span>
            <div className="pf__address-body">
              <span className="pf__address-label">{a.label}</span>
              <span className="pf__address-text">{a.address}</span>
            </div>
            <button className="pf__row-remove" onClick={() => onChange(addresses.filter((x) => x.id !== a.id))} aria-label="Eliminar dirección">🗑</button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="pf__add-form">
          <div className="rv-form-field">
            <span className="rv-form-label">Nombre (Casa, Trabajo…)</span>
            <input className="rv-form-input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="rv-form-field">
            <span className="rv-form-label">Dirección completa</span>
            <input className="rv-form-input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          {error && <span className="rv-form-error">{error}</span>}
          <div className="rv-form-actions">
            <button className="rv-btn rv-btn--ghost" onClick={() => { setAdding(false); setError(null); }}>Cancelar</button>
            <button className="rv-btn" onClick={addAddress}>Guardar dirección</button>
          </div>
        </div>
      ) : (
        <button className="pf__add-btn" onClick={() => setAdding(true)}>+ Agregar dirección</button>
      )}
    </Modal>
  );
}
