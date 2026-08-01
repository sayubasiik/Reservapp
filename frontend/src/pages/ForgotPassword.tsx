import {
  useNavigate,
} from 'react-router-dom';

import '../styles/variables.css';
import './Auth.css';

export default function ForgotPassword() {
  const navigate =
    useNavigate();

  return (
    <div className="auth">
      <section className="auth__card">
        <div className="auth__logo">
          RV
        </div>

        <h1 className="auth__title">
          Recuperar contraseña
        </h1>

        <p className="auth__subtitle">
          Función no disponible en esta versión
        </p>

        <div
          className="auth__alert"
          role="status"
          style={{
            background: '#EFF6FF',
            borderColor: '#BFDBFE',
            color: '#1E40AF',
          }}
        >
          La API actual no incluye envío de
          correos ni restablecimiento de
          contraseña. Por seguridad, esta
          pantalla no simula el envío de un
          enlace.
        </div>

        <button
          type="button"
          className="auth__submit"
          onClick={() =>
            navigate('/login')
          }
        >
          Volver a iniciar sesión
        </button>

        <p className="auth__foot">
          ¿Necesitas otra cuenta?
          <br />

          <a
            href="/registro"
            className="auth__link"
            onClick={(event) => {
              event.preventDefault();
              navigate('/registro');
            }}
          >
            Crear cuenta
          </a>
        </p>
      </section>

      <footer className="auth__footer">
        reservapp.com/recuperar
      </footer>
    </div>
  );
}
