import { useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import { galleryItems } from '../data/adminData';
import type { CategoryColor } from '../types';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../auth/AuthContext';
import { readImageFile } from '../utils/image';
import '../styles/variables.css';
import './AdminGallery.css';

// Elemento que se muestra en la galería (subido por el admin o de ejemplo).
interface Tile {
  id: string;
  title: string;
  url?: string;         // dataURL si es una imagen real subida
  color?: CategoryColor;// color del recuadro si es un ejemplo (sin foto)
  kind: 'uploaded' | 'seed';
}

// Pantalla 18/20 — Galería (Panel Administrador)
export default function AdminGallery() {
  const { getGallery, addGalleryImage, removeGalleryImage, renameGalleryImage } = useStore();
  const { user } = useAuth();
  const bizId = user?.businessId;
  const bizName = user?.name;
  const fileRef = useRef<HTMLInputElement>(null);

  // Ejemplos de este negocio (editables/eliminables solo en la sesión).
  const [seed, setSeed] = useState<Tile[]>(() =>
    galleryItems
      .filter((g) => !bizName || g.business === bizName)
      .map((g, i) => ({ id: `seed-${i}`, title: g.title, color: g.color, kind: 'seed' as const })),
  );

  const uploaded: Tile[] = getGallery(bizId).map((g) => ({ id: g.id, title: g.title, url: g.url, kind: 'uploaded' }));
  const tiles = [...uploaded, ...seed];

  // Modal de subida
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal de edición (renombrar)
  const [editing, setEditing] = useState<Tile | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const openUpload = () => { setPreview(null); setTitle(''); setError(null); setUploadOpen(true); };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setPreview(await readImageFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    }
    e.target.value = '';
  };

  const saveUpload = () => {
    if (!preview) { setError('Elige una imagen para subir.'); return; }
    if (!bizId) { setError('Tu cuenta no tiene un negocio asignado.'); return; }
    addGalleryImage(bizId, { title: title.trim() || 'Sin título', url: preview });
    setUploadOpen(false);
  };

  const startEdit = (t: Tile) => { setEditing(t); setEditTitle(t.title); };
  const saveEdit = () => {
    if (!editing) return;
    const name = editTitle.trim() || 'Sin título';
    if (editing.kind === 'uploaded' && bizId) renameGalleryImage(bizId, editing.id, name);
    else setSeed((prev) => prev.map((s) => (s.id === editing.id ? { ...s, title: name } : s)));
    setEditing(null);
  };

  const remove = (t: Tile) => {
    if (!window.confirm(`¿Eliminar “${t.title}” de la galería?`)) return;
    if (t.kind === 'uploaded' && bizId) removeGalleryImage(bizId, t.id);
    else setSeed((prev) => prev.filter((s) => s.id !== t.id));
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <h1 className="ad__title">Galería</h1>
        <button className="ad__btn" onClick={openUpload}>⬆ Subir imagen</button>
      </header>

      {/* Grid de imágenes */}
      <div className="ag__grid">
        {/* Cuadro para subir */}
        <button className="ag__upload-box" onClick={openUpload}>
          <span className="ag__upload-icon">＋</span>
          <span className="ag__upload-text">Subir imagen</span>
          <span className="ag__upload-hint">JPG o PNG, máx. 4 MB</span>
        </button>

        {tiles.map((t) => (
          <article key={t.id} className="ag__item">
            <div className={`ag__media ${t.color ? `ag__media--${t.color}` : ''}`}>
              {t.url ? (
                <img className="ag__img" src={t.url} alt={t.title} />
              ) : (
                <span className="ag__thumb">🖼️</span>
              )}
              <div className="ag__tools">
                <button className="ag__tool" aria-label="Editar" onClick={() => startEdit(t)}>✎</button>
                <button className="ag__tool" aria-label="Eliminar" onClick={() => remove(t)}>🗑</button>
              </div>
            </div>
            <div className="ag__body">
              <h3 className="ag__title-item">{t.title}</h3>
              <p className="ag__business">{bizName}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Modal de subida */}
      <Modal open={uploadOpen} title="Subir imagen" onClose={() => setUploadOpen(false)}>
        <button className="ag__dropzone" onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img className="ag__dropzone-preview" src={preview} alt="Vista previa" />
          ) : (
            <>
              <span className="ag__dropzone-icon">🖼️</span>
              <span className="ag__dropzone-text">Toca para elegir una imagen</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />

        <div className="rv-form-field" style={{ marginTop: 'var(--rv-space-2)' }}>
          <span className="rv-form-label">Título</span>
          <input className="rv-form-input" placeholder="Ej. Interior del local" value={title}
            onChange={(e) => setTitle(e.target.value)} />
        </div>
        {error && <p className="rv-form-error">{error}</p>}
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setUploadOpen(false)}>Cancelar</button>
          <button className="rv-btn" onClick={saveUpload}>Subir</button>
        </div>
      </Modal>

      {/* Modal de edición */}
      <Modal open={!!editing} title="Editar imagen" onClose={() => setEditing(null)}>
        <div className="rv-form-field">
          <span className="rv-form-label">Título</span>
          <input className="rv-form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
        </div>
        <div className="rv-form-actions">
          <button className="rv-btn rv-btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
          <button className="rv-btn" onClick={saveEdit}>Guardar</button>
        </div>
      </Modal>

      <footer className="ad__footer">Galería · 18/20</footer>
    </AdminLayout>
  );
}
