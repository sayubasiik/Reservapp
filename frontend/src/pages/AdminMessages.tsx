import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { businessInitials } from '../data/businesses';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import '../styles/variables.css';
import './AdminMessages.css';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Pantalla 19/20 — Mensajes (Panel Administrador)
export default function AdminMessages() {
  const { conversations, sendMessage, readConversation, addConversation } = useStore();
  const { user } = useAuth();
  const bizName = user?.name;

  // Solo las conversaciones de ESTE negocio.
  const myConvs = conversations.filter((c) => !bizName || c.context.includes(bizName));

  const [activeId, setActiveId] = useState(myConvs[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  // Modal nuevo mensaje
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [error, setError] = useState<string | null>(null);

  const visible = myConvs.filter((c) => !search.trim() || norm(c.name).includes(norm(search.trim())));
  const active = myConvs.find((c) => c.id === activeId) ?? myConvs[0];

  const selectConv = (id: string) => {
    setActiveId(id);
    readConversation(id);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    sendMessage(active.id, text);
    setDraft('');
  };

  const openNew = () => { setForm({ name: '', phone: '', message: '' }); setError(null); setNewOpen(true); };

  const createConv = () => {
    if (!form.name.trim()) { setError('Escribe el nombre del cliente.'); return; }
    if (!form.message.trim()) { setError('Escribe el primer mensaje.'); return; }
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const id = addConversation({
      initials: businessInitials(form.name),
      name: form.name.trim(),
      context: `${bizName ?? 'Negocio'} · Nueva conversación`,
      unread: 0,
      phone: form.phone.trim() || undefined,
      messages: [{ text: form.message.trim(), time: now, mine: true }],
    });
    setActiveId(id);
    setNewOpen(false);
  };

  const openWhatsApp = () => {
    if (!active) return;
    const ok = sendWhatsAppMessage(active.phone ?? '', `Hola ${active.name}, te escribimos de ${bizName ?? 'tu negocio'}.`);
    if (!ok) window.alert('Esta conversación no tiene un número de teléfono guardado.');
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Mensajes</h1>
        <button className="ad__btn" onClick={openNew}>+ Nuevo mensaje</button>
      </header>

      <div className="am__layout">
        {/* Lista de conversaciones */}
        <aside className="am__list">
          <div className="am__search">
            <span className="am__search-icon">🔍</span>
            <input
              className="am__search-input"
              placeholder="Buscar conversación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {visible.length === 0 && (
            <p className="am__empty">
              {myConvs.length === 0 ? 'Aún no hay conversaciones para este negocio.' : 'Sin coincidencias.'}
            </p>
          )}
          {visible.map((c) => (
            <button
              key={c.id}
              className={`am__conv ${c.id === active?.id ? 'is-active' : ''}`}
              onClick={() => selectConv(c.id)}
            >
              <span className="am__avatar">{c.initials}</span>
              <div className="am__conv-body">
                <div className="am__conv-top">
                  <span className="am__conv-name">{c.name}</span>
                  <span className="am__conv-time">{c.messages[c.messages.length - 1]?.time ?? ''}</span>
                </div>
                <span className="am__conv-preview">
                  {c.messages[c.messages.length - 1]?.text ?? ''}
                </span>
              </div>
              {c.unread > 0 && <span className="am__unread">{c.unread}</span>}
            </button>
          ))}
        </aside>

        {/* Chat activo */}
        <section className="am__chat">
          {active ? (
            <>
              <header className="am__chat-head">
                <div>
                  <h2 className="am__chat-name">{active.name}</h2>
                  <p className="am__chat-context">{active.context}</p>
                </div>
                <button className="am__wa-btn" onClick={openWhatsApp} title="Continuar en WhatsApp">
                  <span aria-hidden>🟢</span> WhatsApp
                </button>
              </header>

              <div className="am__messages">
                {active.messages.map((m, i) => (
                  <div key={i} className={`am__msg ${m.mine ? 'is-mine' : ''}`}>
                    <div className="am__bubble">{m.text}</div>
                    <span className="am__msg-time">{m.time}</span>
                  </div>
                ))}
              </div>

              <form className="am__composer" onSubmit={handleSend}>
                <input
                  className="am__composer-input"
                  placeholder="Escribir mensaje..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="am__send" aria-label="Enviar">➤</button>
              </form>
            </>
          ) : (
            <p className="am__empty" style={{ margin: 'auto' }}>Selecciona o crea una conversación.</p>
          )}
        </section>
      </div>

      {/* Modal nuevo mensaje */}
      <Modal open={newOpen} title="Nuevo mensaje" onClose={() => setNewOpen(false)}>
        <div className="rv-form-field">
          <span className="rv-form-label">Cliente</span>
          <input className="rv-form-input" placeholder="Nombre del cliente" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="rv-form-field">
          <span className="rv-form-label">Teléfono (para WhatsApp)</span>
          <input className="rv-form-input" type="tel" placeholder="Ej. 55 1234 5678" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="rv-form-field">
          <span className="rv-form-label">Mensaje</span>
          <textarea className="rv-form-input" rows={3} placeholder="Escribe el primer mensaje..." value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </div>
        {error && <p className="rv-form-error">{error}</p>}
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setNewOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={createConv}>Crear conversación</button>
        </div>
      </Modal>

      <footer className="ad__footer">Mensajes · 19/20</footer>
    </AdminLayout>
  );
}
