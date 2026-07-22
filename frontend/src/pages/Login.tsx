import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/AuthContext';
import '../styles/variables.css';
import './Auth.css';

// Correo con formato válido: algo@algo.dominio
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cuentas de prueba (para poder demostrar el login sin backend).
const DEMO = {
  customer: { email: 'olaf.andrade@correo.com', password: '123456' },
  admin: { email: 'contacto@barberiaelite.com', password: 'admin123' },
};

// Pantalla 2/20 — Inicio de Sesión
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [remember, setRemember] = useState(false);
  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [alert, setAlert] = useState<string | null>(null);

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Escribe tu correo electrónico.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'El correo no tiene un formato válido.';
    if (!password) e.password = 'Escribe tu contraseña.';
    else if (password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setAlert(null);
    if (!validate()) return;
    const res = login(email, password, role);
    if (!res.ok) {
      setAlert(res.error ?? 'No se pudo iniciar sesión.');
      return;
    }
    navigate(role === 'admin' ? '/admin' : '/');
  };

  const fillDemo = () => {
    const creds = DEMO[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setErrors({});
    setAlert(null);
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit} noValidate>
        <div className="auth__logo">RV</div>
        <h1 className="auth__title">Iniciar Sesión</h1>
        <p className="auth__subtitle">Bienvenido de nuevo</p>

        {/* Selector de tipo de cuenta */}
        <div className="auth__roles">
          <button
            type="button"
            className={`auth__role ${role === 'customer' ? 'is-active' : ''}`}
            onClick={() => { setRole('customer'); setAlert(null); }}
          >
            <span className="auth__role-icon">🧑</span>
            Cliente
          </button>
          <button
            type="button"
            className={`auth__role ${role === 'admin' ? 'is-active' : ''}`}
            onClick={() => { setRole('admin'); setAlert(null); }}
          >
            <span className="auth__role-icon">🏢</span>
            Administrador
          </button>
        </div>

        {/* Cuentas de prueba */}
        <div className="auth__demo">
          <div className="auth__demo-title">Cuenta de prueba ({role === 'admin' ? 'negocio' : 'cliente'})</div>
          <div className="auth__demo-btns">
            <button type="button" className="auth__demo-btn" onClick={fillDemo}>
              Usar cuenta demo
            </button>
          </div>
        </div>

        {alert && <div className="auth__alert">⚠ {alert}</div>}

        <label className="auth__field">
          <span className="auth__field-label">Correo electrónico</span>
          <input
            type="email"
            className={`auth__input ${errors.email ? 'has-error' : ''}`}
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="auth__error">{errors.email}</span>}
        </label>

        <label className="auth__field">
          <span className="auth__field-label">Contraseña</span>
          <input
            type="password"
            className={`auth__input ${errors.password ? 'has-error' : ''}`}
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <span className="auth__error">{errors.password}</span>}
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
          <a
            href="#"
            className="auth__link"
            onClick={(e) => { e.preventDefault(); navigate('/recuperar'); }}
          >
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
