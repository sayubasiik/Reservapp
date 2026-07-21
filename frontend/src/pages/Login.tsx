import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/AuthContext';
import { businesses } from '../data/businesses';
import '../styles/variables.css';
import './Auth.css';

// Pantalla 2/20 — Inicio de Sesión
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [remember, setRemember] = useState(false);
  const [role, setRole] = useState<Role>('customer');
  const [businessId, setBusinessId] = useState(businesses[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Inicia sesión con el rol elegido y entra a la vista correspondiente.
    // Si es admin, entra al panel de SU negocio (existente).
    login(role, { businessId });
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <div className="auth__logo">RV</div>
        <h1 className="auth__title">Iniciar Sesión</h1>
        <p className="auth__subtitle">Bienvenido de nuevo</p>

        {/* Selector de tipo de cuenta */}
        <div className="auth__roles">
          <button
            type="button"
            className={`auth__role ${role === 'customer' ? 'is-active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <span className="auth__role-icon">🧑</span>
            Cliente
          </button>
          <button
            type="button"
            className={`auth__role ${role === 'admin' ? 'is-active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <span className="auth__role-icon">🏢</span>
            Administrador
          </button>
        </div>

        {/* Negocio a administrar (solo admin) */}
        {role === 'admin' && (
          <label className="auth__field">
            <span className="auth__field-label">Negocio</span>
            <select
              className="auth__input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className="auth__field">
          <span className="auth__field-label">Correo electrónico</span>
          <input type="email" className="auth__input" placeholder="ejemplo@correo.com" />
        </label>

        <label className="auth__field">
          <span className="auth__field-label">Contraseña</span>
          <input type="password" className="auth__input" placeholder="••••••••••" />
        </label>

        <div className="auth__row">
          <label className="auth__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Recordarme
          </label>
          <a href="#" className="auth__link" onClick={(e) => e.preventDefault()}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button type="submit" className="auth__submit">
          {role === 'admin' ? 'Entrar al panel' : 'Ingresar'}
        </button>

        <p className="auth__foot">
          ¿No tienes cuenta?<br />
          <a href="#" className="auth__link" onClick={(e) => { e.preventDefault(); navigate('/registro'); }}>
            Crear cuenta
          </a>
        </p>
      </form>

      <footer className="auth__footer">reservvap.com/login</footer>
    </div>
  );
}
