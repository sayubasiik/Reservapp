import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';
import {
  AlertIcon,
} from '../components/AuthIcons';

import '../styles/variables.css';
import './Auth.css';

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [errors, setErrors] =
    useState<{
      email?: string;
      password?: string;
    }>({});

  const [alert, setAlert] =
    useState<string | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const validate = () => {
    const nextErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email.trim()) {
      nextErrors.email =
        'Escribe tu correo electrónico.';
    } else if (
      !EMAIL_RE.test(email.trim())
    ) {
      nextErrors.email =
        'El correo no tiene un formato válido.';
    }

    if (!password) {
      nextErrors.password =
        'Escribe tu contraseña.';
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAlert(null);

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const result =
        await login(
          email,
          password,
        );

      if (!result.ok || !result.user) {
        setAlert(
          result.error ??
            'No se pudo iniciar sesión.',
        );

        return;
      }

      if (
        result.requiresBusinessSetup ||
        result.user.needsBusinessSetup
      ) {
        navigate(
          '/completar-negocio',
          {
            replace: true,
          },
        );

        return;
      }

      navigate(
        result.user.role === 'customer'
          ? '/'
          : '/admin',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form
        className="auth__card"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth__logo">
          RV
        </div>

        <h1 className="auth__title">
          Iniciar Sesión
        </h1>

        <p className="auth__subtitle">
          Bienvenido de nuevo
        </p>

        <div className="auth__demo">
          <p className="auth__demo-hint">
            El tipo de cuenta y sus
            permisos se determinan
            automáticamente con la
            información registrada en el
            servidor.
          </p>
        </div>

        {alert && (
          <div
            className="auth__alert"
            role="alert"
          >
            <AlertIcon
              className="auth__alert-icon"
              size={19}
            />

            <span>{alert}</span>
          </div>
        )}

        <label className="auth__field">
          <span className="auth__field-label">
            Correo electrónico
          </span>

          <input
            type="email"
            autoComplete="email"
            className={`auth__input ${
              errors.email
                ? 'has-error'
                : ''
            }`}
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.email && (
            <span className="auth__error">
              {errors.email}
            </span>
          )}
        </label>

        <label className="auth__field">
          <span className="auth__field-label">
            Contraseña
          </span>

          <input
            type="password"
            autoComplete="current-password"
            className={`auth__input ${
              errors.password
                ? 'has-error'
                : ''
            }`}
            placeholder="••••••••••"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.password && (
            <span className="auth__error">
              {errors.password}
            </span>
          )}
        </label>

        <div className="auth__row">
          <span />

          <a
            href="#"
            className="auth__link"
            onClick={(event) => {
              event.preventDefault();
              navigate('/recuperar');
            }}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button
          type="submit"
          className="auth__submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Ingresando…'
            : 'Ingresar'}
        </button>

        <p className="auth__foot">
          ¿No tienes cuenta?
          <br />

          <a
            href="#"
            className="auth__link"
            onClick={(event) => {
              event.preventDefault();
              navigate('/registro');
            }}
          >
            Crear cuenta
          </a>
        </p>
      </form>

      <footer className="auth__footer">
        reservvap.com/login
      </footer>
    </div>
  );
}
