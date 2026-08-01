import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import type {
  RegisterRole,
} from '../auth/AuthContext';

import {
  businessCategories,
} from '../data/businesses';

import type {
  BusinessType,
} from '../data/businesses';

import {
  AlertIcon,
  BuildingIcon,
  UserIcon,
} from '../components/AuthIcons';

import '../styles/variables.css';
import './Auth.css';

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const digitsOf = (value: string) =>
  value.replace(/\D/g, '');

type Errors = Partial<
  Record<
    | 'name'
    | 'businessName'
    | 'businessAddress'
    | 'phone'
    | 'email'
    | 'password'
    | 'confirm'
    | 'accept',
    string
  >
>;

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] =
    useState<RegisterRole>(
      'customer',
    );

  const [name, setName] =
    useState('');

  const [
    businessName,
    setBusinessName,
  ] = useState('');

  const [
    businessAddress,
    setBusinessAddress,
  ] = useState('');

  const [
    businessDescription,
    setBusinessDescription,
  ] = useState('');

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirm, setConfirm] =
    useState('');

  const [accept, setAccept] =
    useState(false);

  const [
    businessType,
    setBusinessType,
  ] = useState<BusinessType>(
    'alimentos',
  );

  const [errors, setErrors] =
    useState<Errors>({});

  const [alert, setAlert] =
    useState<string | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const validate = () => {
    const nextErrors: Errors = {};

    if (!name.trim()) {
      nextErrors.name =
        'Escribe tu nombre completo.';
    }

    if (
      role === 'admin' &&
      !businessName.trim()
    ) {
      nextErrors.businessName =
        'Escribe el nombre del negocio.';
    }

    if (
      role === 'admin' &&
      !businessAddress.trim()
    ) {
      nextErrors.businessAddress =
        'Escribe la dirección del negocio.';
    }

    if (!phone.trim()) {
      nextErrors.phone =
        'Escribe tu teléfono.';
    } else if (
      digitsOf(phone).length < 10
    ) {
      nextErrors.phone =
        'El teléfono debe tener al menos 10 dígitos.';
    }

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
        'Crea una contraseña.';
    } else if (
      password.length < 8
    ) {
      nextErrors.password =
        'La contraseña debe tener al menos 8 caracteres.';
    }

    if (confirm !== password) {
      nextErrors.confirm =
        'Las contraseñas no coinciden.';
    }

    if (!accept) {
      nextErrors.accept =
        'Debes aceptar los términos y condiciones.';
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
        await register({
          role,
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          business:
            role === 'admin'
              ? {
                  name:
                    businessName.trim(),
                  category:
                    businessType,
                  phone:
                    phone.trim(),
                  address:
                    businessAddress.trim(),
                  description:
                    businessDescription.trim(),
                }
              : undefined,
        });

      if (
        result.requiresBusinessSetup &&
        result.user
      ) {
        navigate(
          '/completar-negocio',
          {
            replace: true,
            state: {
              message: result.error,
            },
          },
        );

        return;
      }

      if (!result.ok || !result.user) {
        setAlert(
          result.error ??
            'No se pudo crear la cuenta.',
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
        <h1 className="auth__title">
          Crear Cuenta
        </h1>

        <p className="auth__subtitle">
          Completa tus datos
        </p>

        <div className="auth__roles">
          <button
            type="button"
            className={`auth__role ${
              role === 'customer'
                ? 'is-active'
                : ''
            }`}
            onClick={() =>
              setRole('customer')
            }
            disabled={isSubmitting}
          >
            <span className="auth__role-icon">
              <UserIcon size={27} />
            </span>

            Soy cliente
          </button>

          <button
            type="button"
            className={`auth__role ${
              role === 'admin'
                ? 'is-active'
                : ''
            }`}
            onClick={() =>
              setRole('admin')
            }
            disabled={isSubmitting}
          >
            <span className="auth__role-icon">
              <BuildingIcon size={27} />
            </span>

            Tengo un negocio
          </button>
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
            Nombre completo
          </span>

          <input
            type="text"
            autoComplete="name"
            maxLength={120}
            className={`auth__input ${
              errors.name
                ? 'has-error'
                : ''
            }`}
            placeholder="Tu nombre y apellidos"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.name && (
            <span className="auth__error">
              {errors.name}
            </span>
          )}
        </label>

        {role === 'admin' && (
          <>
            <label className="auth__field">
              <span className="auth__field-label">
                Nombre del negocio
              </span>

              <input
                type="text"
                maxLength={120}
                className={`auth__input ${
                  errors.businessName
                    ? 'has-error'
                    : ''
                }`}
                placeholder="Ej. Barberia Elite"
                value={businessName}
                onChange={(event) =>
                  setBusinessName(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
              />

              {errors.businessName && (
                <span className="auth__error">
                  {errors.businessName}
                </span>
              )}
            </label>

            <div className="auth__field">
              <span className="auth__field-label">
                Tipo de negocio
              </span>

              <div className="auth__cats">
                {businessCategories.map(
                  (category) => (
                    <button
                      type="button"
                      key={category.type}
                      className={`auth__cat ${
                        businessType ===
                        category.type
                          ? 'is-active'
                          : ''
                      }`}
                      onClick={() =>
                        setBusinessType(
                          category.type,
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      {category.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <label className="auth__field">
              <span className="auth__field-label">
                Dirección del negocio
              </span>

              <input
                type="text"
                maxLength={250}
                className={`auth__input ${
                  errors.businessAddress
                    ? 'has-error'
                    : ''
                }`}
                placeholder="Calle, número, colonia"
                value={businessAddress}
                onChange={(event) =>
                  setBusinessAddress(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
              />

              {errors.businessAddress && (
                <span className="auth__error">
                  {errors.businessAddress}
                </span>
              )}
            </label>

            <label className="auth__field">
              <span className="auth__field-label">
                Descripción del negocio
                {' '}
                <span className="auth__optional">
                  (opcional)
                </span>
              </span>

              <textarea
                className="auth__input auth__textarea"
                maxLength={500}
                rows={4}
                placeholder="Describe brevemente los servicios que ofreces"
                value={businessDescription}
                onChange={(event) =>
                  setBusinessDescription(
                    event.target.value,
                  )
                }
                disabled={isSubmitting}
              />
            </label>
          </>
        )}

        <label className="auth__field">
          <span className="auth__field-label">
            Teléfono
          </span>

          <input
            type="tel"
            autoComplete="tel"
            maxLength={30}
            className={`auth__input ${
              errors.phone
                ? 'has-error'
                : ''
            }`}
            placeholder="449 123 4567"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.phone && (
            <span className="auth__error">
              {errors.phone}
            </span>
          )}
        </label>

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
            autoComplete="new-password"
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

        <label className="auth__field">
          <span className="auth__field-label">
            Confirmar contraseña
          </span>

          <input
            type="password"
            autoComplete="new-password"
            className={`auth__input ${
              errors.confirm
                ? 'has-error'
                : ''
            }`}
            placeholder="••••••••••"
            value={confirm}
            onChange={(event) =>
              setConfirm(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.confirm && (
            <span className="auth__error">
              {errors.confirm}
            </span>
          )}
        </label>

        <label className="auth__check auth__check--terms">
          <input
            type="checkbox"
            checked={accept}
            onChange={(event) =>
              setAccept(
                event.target.checked,
              )
            }
            disabled={isSubmitting}
          />

          Acepto los{' '}
          <a
            href="#"
            className="auth__link"
            onClick={(event) =>
              event.preventDefault()
            }
          >
            Términos y condiciones
          </a>
        </label>

        {errors.accept && (
          <span
            className="auth__error"
            style={{
              display: 'block',
              marginTop: '-8px',
              marginBottom: '12px',
            }}
          >
            {errors.accept}
          </span>
        )}

        <button
          type="submit"
          className="auth__submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Creando cuenta…'
            : 'Registrarme'}
        </button>

        <p className="auth__foot">
          ¿Ya tienes cuenta?
          <br />

          <a
            href="#"
            className="auth__link"
            onClick={(event) => {
              event.preventDefault();
              navigate('/login');
            }}
          >
            Inicia sesión
          </a>
        </p>
      </form>

      <footer className="auth__footer">
        reservvap.com/registro
      </footer>
    </div>
  );
}
