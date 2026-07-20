import axios from "axios";
import {
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { loginUser } from "../api/auth";
import "./LoginPage.css";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [rememberMe, setRememberMe] =
    useState(false);
  const [errors, setErrors] =
    useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email =
        "Ingresa tu correo electrónico.";
    } else if (
      !EMAIL_PATTERN.test(email.trim())
    ) {
      nextErrors.email =
        "Ingresa un correo electrónico válido.";
    }

    if (!password.trim()) {
      nextErrors.password =
        "Ingresa tu contraseña.";
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationErrors =
      validateForm();

    if (
      Object.keys(validationErrors).length >
      0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      const token =
        data.access_token ?? data.token;

      if (!token) {
        throw new Error(
          "La API no devolvió un token de acceso.",
        );
      }

      if (rememberMe) {
        sessionStorage.removeItem(
          "accessToken",
        );
        localStorage.setItem(
          "accessToken",
          token,
        );
      } else {
        localStorage.removeItem(
          "accessToken",
        );
        sessionStorage.setItem(
          "accessToken",
          token,
        );
      }

      const role =
        data.user?.role ?? data.role;

      if (role === "business_owner") {
        navigate("/panel");
        return;
      }

      navigate("/inicio");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setErrors({
            general:
              "Correo o contraseña incorrectos.",
          });
        } else if (!error.response) {
          setErrors({
            general:
              "No fue posible conectar con el servidor.",
          });
        } else {
          setErrors({
            general:
              "Ocurrió un error al iniciar sesión. Inténtalo nuevamente.",
          });
        }
      } else {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        <header className="login-header">
          <div
            className="login-logo"
            aria-label="ReservVap"
          >
            RV
          </div>

          <h1 id="login-title">
            Iniciar sesión
          </h1>

          <p>Bienvenido de nuevo</p>
        </header>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {errors.general && (
            <div
              className="login-form__server-error"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              aria-invalid={
                Boolean(errors.email)
              }
              aria-describedby={
                errors.email
                  ? "email-error"
                  : undefined
              }
              onChange={(event) => {
                setEmail(event.target.value);

                if (errors.email) {
                  setErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }
              }}
            />

            {errors.email && (
              <p
                id="email-error"
                className="form-field__error"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              placeholder="••••••••••"
              autoComplete="current-password"
              aria-invalid={
                Boolean(errors.password)
              }
              aria-describedby={
                errors.password
                  ? "password-error"
                  : undefined
              }
              onChange={(event) => {
                setPassword(
                  event.target.value,
                );

                if (errors.password) {
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }
              }}
            />

            {errors.password && (
              <p
                id="password-error"
                className="form-field__error"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
              />

              <span>Recordarme</span>
            </label>

            <Link
              to="/recuperar-contrasena"
              className="login-link"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Ingresando..."
              : "Ingresar"}
          </button>
        </form>

        <footer className="login-footer">
          <span>¿No tienes cuenta?</span>

          <Link
            to="/registro"
            className="login-link"
          >
            Crear cuenta
          </Link>
        </footer>
      </section>
    </main>
  );
}