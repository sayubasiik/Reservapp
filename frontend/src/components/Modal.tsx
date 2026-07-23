import type { ReactNode } from 'react';
import { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Ancho máximo del cuadro (por defecto 460px). */
  width?: number;
}

// Cuadro modal reutilizable (perfil, galería, clientes, nueva reserva, etc.).
export default function Modal({ open, title, onClose, children, width = 460 }: ModalProps) {
  // Cierra con la tecla Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rv-modal" onClick={onClose}>
      <div
        className="rv-modal__box"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="rv-modal__head">
          <h2 className="rv-modal__title">{title}</h2>
          <button className="rv-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div className="rv-modal__body">{children}</div>
      </div>
    </div>
  );
}
