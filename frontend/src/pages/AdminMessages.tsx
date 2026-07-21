import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import '../styles/variables.css';
import './AdminMessages.css';

// Pantalla 19/20 — Mensajes (Panel Administrador)
export default function AdminMessages() {
  const { conversations, sendMessage, readConversation } = useStore();
  const { user } = useAuth();
  const bizName = user?.name;

  // Solo las conversaciones de ESTE negocio.
  const myConvs = conversations.filter((c) => !bizName || c.context.includes(bizName));

  const [activeId, setActiveId] = useState(myConvs[0]?.id ?? '');
  const [draft, setDraft] = useState('');

  const active = myConvs.find((c) => c.id === activeId) ?? myConvs[0];

  const selectConv = (id: string) => {
    setActiveId(id);
    readConversation(id); // marca como leído
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    sendMessage(active.id, text);
    setDraft('');
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Mensajes</h1>
      </header>

      <div className="am__layout">
        {/* Lista de conversaciones */}
        <aside className="am__list">
          <div className="am__search">
            <span className="am__search-icon">🔍</span>
            <input className="am__search-input" placeholder="Buscar conversación..." />
          </div>
          {myConvs.length === 0 && (
            <p className="am__empty">Aún no hay conversaciones para este negocio.</p>
          )}
          {myConvs.map((c) => (
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
          {active && (
            <>
              <header className="am__chat-head">
                <h2 className="am__chat-name">{active.name}</h2>
                <p className="am__chat-context">{active.context}</p>
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
          )}
        </section>
      </div>

      <footer className="ad__footer">Mensajes · 19/20</footer>
    </AdminLayout>
  );
}
