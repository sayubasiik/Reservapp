import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/variables.css';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Recuperar contraseña. En la maqueta solo valida el correo y muestra
// el mensaje de confirmación; con backend enviaría el correo real.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Escribe un correo con formato válido.');
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth__title">Recuperar contraseña</h1>
        <p className="auth__subtitle">Te enviaremos instrucciones a tu correo</p>

        {sent ? (
          <>
            <div className="auth__alert" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}>
              ✓ Si <strong>&nbsp;{email.trim()}&nbsp;</strong> está registrado, te enviamos un enlace para restablecer tu contraseña.
            </div>
            <button type="button" className="auth__submit" onClick={() => navigate('/login')}>
              Volver a iniciar sesión
            </button>
          </>
        ) : (
          <>
            <label className="auth__field">
              <span className="auth__field-label">Correo electrónico</span>
              <input
                type="email"
                className={`auth__input ${error ? 'has-error' : ''}`}
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <span className="auth__error">{error}</span>}
            </label>

            <button type="submit" className="auth__submit">Enviar instrucciones</button>

            <p className="auth__foot">
              <a href="#" className="auth__link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Volver a iniciar sesión
              </a>
            </p>
          </>
        )}
      </form>

      <footer className="auth__footer">reservvap.com/recuperar</footer>
    </div>
  );
}
