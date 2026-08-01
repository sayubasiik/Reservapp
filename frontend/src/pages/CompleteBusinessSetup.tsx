import {
  useEffect,
  useState,
} from 'react';
import type {
  FormEvent,
} from 'react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';
import {
  AlertIcon,
  BuildingIcon,
} from '../components/AuthIcons';
import {
  businessCategories,
} from '../data/businesses';
import type {
  BusinessType,
} from '../data/businesses';

import '../styles/variables.css';
import './Auth.css';

interface LocationState {
  message?: string;
}

type Errors = Partial<
  Record<
    | 'name'
    | 'phone'
    | 'address',
    string
  >
>;

const digitsOf = (value: string) =>
  value.replace(/\D/g, '');

export default function CompleteBusinessSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    completeBusinessSetup,
    logout,
  } = useAuth();

  const state =
    location.state as
      | LocationState
      | null;

  const [name, setName] =
    useState(
      user?.businessName ?? '',
    );

  const [phone, setPhone] =
    useState(
      user?.phone ?? '',
    );

  const [address, setAddress] =
    useState(
      user?.businessAddress ?? '',
    );

  const [
    description,
    setDescription,
  ] = useState(
    user?.businessDescription ?? '',
  );

  const [
    category,
    setCategory,
  ] = useState<BusinessType>(
    user?.businessType ??
      'alimentos',
  );

  const [errors, setErrors] =
    useState<Errors>({});

  const [alert, setAlert] =
    useState<string | null>(
      state?.message ?? null,
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (
      user?.apiBusinessId &&
      !user.needsBusinessSetup
    ) {
      navigate(
        '/admin',
        {
          replace: true,
        },
      );
    }
  }, [
    navigate,
    user?.apiBusinessId,
    user?.needsBusinessSetup,
  ]);

  const validate = () => {
    const nextErrors: Errors = {};

    if (!name.trim()) {
      nextErrors.name =
        'Escribe el nombre del negocio.';
    }

    if (!phone.trim()) {
      nextErrors.phone =
        'Escribe el teléfono del negocio.';
    } else if (
      digitsOf(phone).length < 10
    ) {
      nextErrors.phone =
        'El teléfono debe tener al menos 10 dígitos.';
    }

    if (!address.trim()) {
      nextErrors.address =
        'Escribe la dirección del negocio.';
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
        await completeBusinessSetup({
          name: name.trim(),
          category,
          phone: phone.trim(),
          address: address.trim(),
          description:
            description.trim(),
        });

      if (!result.ok) {
        setAlert(
          result.error ??
            'No se pudo registrar el negocio.',
        );

        return;
      }

      navigate(
        '/admin',
        {
          replace: true,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(
      '/login',
      {
        replace: true,
      },
    );
  };

  return (
    <div className="auth">
      <form
        className="auth__card"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth__setup-icon">
          <BuildingIcon size={32} />
        </div>

        <h1 className="auth__title">
          Completar negocio
        </h1>

        <p className="auth__subtitle">
          Tu cuenta ya existe. Completa
          estos datos para abrir el panel
          administrativo.
        </p>

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
            Nombre del negocio
          </span>

          <input
            type="text"
            maxLength={120}
            className={`auth__input ${
              errors.name
                ? 'has-error'
                : ''
            }`}
            placeholder="Ej. Barbería Elite"
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

        <div className="auth__field">
          <span className="auth__field-label">
            Tipo de negocio
          </span>

          <div className="auth__cats">
            {businessCategories.map(
              (item) => (
                <button
                  type="button"
                  key={item.type}
                  className={`auth__cat ${
                    category === item.type
                      ? 'is-active'
                      : ''
                  }`}
                  onClick={() =>
                    setCategory(
                      item.type,
                    )
                  }
                  disabled={isSubmitting}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
        </div>

        <label className="auth__field">
          <span className="auth__field-label">
            Teléfono del negocio
          </span>

          <input
            type="tel"
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
            Dirección del negocio
          </span>

          <input
            type="text"
            maxLength={250}
            className={`auth__input ${
              errors.address
                ? 'has-error'
                : ''
            }`}
            placeholder="Calle, número, colonia"
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          {errors.address && (
            <span className="auth__error">
              {errors.address}
            </span>
          )}
        </label>

        <label className="auth__field">
          <span className="auth__field-label">
            Descripción
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
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />
        </label>

        <button
          type="submit"
          className="auth__submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Guardando…'
            : 'Registrar negocio'}
        </button>

        <p className="auth__foot">
          Sesión iniciada como
          <br />

          <strong>
            {user?.email}
          </strong>
          <br />

          <button
            type="button"
            className="auth__link-button"
            onClick={handleLogout}
            disabled={isSubmitting}
          >
            Cerrar sesión
          </button>
        </p>
      </form>

      <footer className="auth__footer">
        reservapp.com/completar-negocio
      </footer>
    </div>
  );
}
