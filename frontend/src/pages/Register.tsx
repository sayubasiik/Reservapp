import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/AuthContext';
import { businessCategories } from '../data/businesses';
import type { BusinessType } from '../data/businesses';
import '../styles/variables.css';
import './Auth.css';

// Pantalla 3/20 — Registro (Crear Cuenta)
export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accept, setAccept] = useState(false);
  const [role, setRole] = useState<Role>('customer');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('alimentos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Crea la cuenta. Si es negocio, se crea con su nombre y giro.
    login(role, role === 'admin' ? { businessName: businessName || 'Mi Negocio', businessType } : undefined);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
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

        {role === 'admin' ? (
          <>
            <label className="auth__field">
              <span className="auth__field-label">Nombre del negocio</span>
              <input
                type="text"
                className="auth__input"
                placeholder="Ej. Tacos El Güero"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
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
            <input type="text" className="auth__input" placeholder="Tu nombre" />
          </label>
        )}

        <label className="auth__field">
          <span className="auth__field-label">Teléfono</span>
          <input type="tel" className="auth__input" placeholder="(55) 1234 5678" />
        </label>

        <label className="auth__field">
          <span className="auth__field-label">Correo electrónico</span>
          <input type="email" className="auth__input" placeholder="ejemplo@correo.com" />
        </label>

        <label className="auth__field">
          <span className="auth__field-label">Contraseña</span>
          <input type="password" className="auth__input" placeholder="••••••••••" />
        </label>

        <label className="auth__field">
          <span className="auth__field-label">Confirmar contraseña</span>
          <input type="password" className="auth__input" placeholder="••••••••••" />
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
