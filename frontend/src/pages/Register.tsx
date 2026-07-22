import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/AuthContext';
import { businessCategories } from '../data/businesses';
import type { BusinessType } from '../data/businesses';
import '../styles/variables.css';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfono: al menos 10 dígitos (ignorando espacios, guiones y paréntesis).
const digitsOf = (s: string) => s.replace(/\D/g, '');

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'password' | 'confirm' | 'accept', string>>;

// Pantalla 3/20 — Registro (Crear Cuenta)
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accept, setAccept] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>('alimentos');
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!name.trim()) e.name = role === 'admin' ? 'Escribe el nombre del negocio.' : 'Escribe tu nombre.';
    if (!phone.trim()) e.phone = 'Escribe tu teléfono.';
    else if (digitsOf(phone).length < 10) e.phone = 'El teléfono debe tener al menos 10 dígitos.';
    if (!email.trim()) e.email = 'Escribe tu correo electrónico.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'El correo no tiene un formato válido.';
    if (!password) e.password = 'Crea una contraseña.';
    else if (password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (confirm !== password) e.confirm = 'Las contraseñas no coinciden.';
    if (!accept) e.accept = 'Debes aceptar los términos y condiciones.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setAlert(null);
    if (!validate()) return;
    const res = register({
      role,
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      businessType: role === 'admin' ? businessType : undefined,
    });
    if (!res.ok) {
      setAlert(res.error ?? 'No se pudo crear la cuenta.');
      return;
    }
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth__title">Crear Cuenta</h1>
        <p className="auth__subtitle">Completa tus datos</p>

        {/* Tipo de cuenta */}
        <div className="auth__roles">
          <button
            type="button"
            className={`auth__role ${role === 'customer' ? 'is-active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <span className="auth__role-icon">🧑</span>
            Soy cliente
          </button>
          <button
            type="button"
            className={`auth__role ${role === 'admin' ? 'is-active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <span className="auth__role-icon">🏢</span>
            Tengo un negocio
          </button>
        </div>

        {alert && <div className="auth__alert">⚠ {alert}</div>}

        {role === 'admin' ? (
          <>
            <label className="auth__field">
              <span className="auth__field-label">Nombre del negocio</span>
              <input
                type="text"
                className={`auth__input ${errors.name ? 'has-error' : ''}`}
                placeholder="Ej. Tacos El Güero"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="auth__error">{errors.name}</span>}
            </label>

            {/* Giro del negocio */}
            <div className="auth__field">
              <span className="auth__field-label">Tipo de negocio</span>
              <div className="auth__cats">
                {businessCategories.map((c) => (
                  <button
                    type="button"
                    key={c.type}
                    className={`auth__cat ${businessType === c.type ? 'is-active' : ''}`}
                    onClick={() => setBusinessType(c.type)}
                  >
                    <span className="auth__cat-icon">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <label className="auth__field">
            <span className="auth__field-label">Nombre</span>
            <input
              type="text"
              className={`auth__input ${errors.name ? 'has-error' : ''}`}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span className="auth__error">{errors.name}</span>}
          </label>
        )}

        <label className="auth__field">
          <span className="auth__field-label">Teléfono</span>
          <input
            type="tel"
            className={`auth__input ${errors.phone ? 'has-error' : ''}`}
            placeholder="(55) 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && <span className="auth__error">{errors.phone}</span>}
        </label>

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

        <label className="auth__field">
          <span className="auth__field-label">Confirmar contraseña</span>
          <input
            type="password"
            className={`auth__input ${errors.confirm ? 'has-error' : ''}`}
            placeholder="••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {errors.confirm && <span className="auth__error">{errors.confirm}</span>}
        </label>

        <label className="auth__check auth__check--terms">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
          />
          Acepto los{' '}
          <a href="#" className="auth__link" onClick={(e) => e.preventDefault()}>
            Términos y condiciones
          </a>
        </label>
        {errors.accept && <span className="auth__error" style={{ display: 'block', marginTop: '-8px', marginBottom: '12px' }}>{errors.accept}</span>}

        <button type="submit" className="auth__submit">Registrarme</button>

        <p className="auth__foot">
          ¿Ya tienes cuenta?<br />
          <a href="#" className="auth__link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            Inicia sesión
          </a>
        </p>
      </form>

      <footer className="auth__footer">reservvap.com/registro</footer>
    </div>
  );
}
