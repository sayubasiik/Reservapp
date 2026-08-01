import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  getBusiness,
  updateBusiness,
} from '../api/businesses';

import {
  getApiError,
} from '../api/client';

import type {
  Business,
  BusinessUpdate,
} from '../api/types';

import {
  useAuth,
} from '../auth/AuthContext';

import AdminLayout from '../components/AdminLayout';

import '../styles/variables.css';
import './AdminSettings.css';

interface BusinessForm {
  name: string;
  category: string;
  phone: string;
  address: string;
  description: string;
}

const EMPTY_FORM: BusinessForm = {
  name: '',
  category: '',
  phone: '',
  address: '',
  description: '',
};

function toForm(
  business: Business,
): BusinessForm {
  return {
    name: business.name,
    category:
      business.category ?? '',
    phone:
      business.phone ?? '',
    address:
      business.address ?? '',
    description:
      business.description ?? '',
  };
}

function optionalValue(
  value: string,
): string | null {
  const normalized =
    value.trim();

  return normalized || null;
}

function validateForm(
  form: BusinessForm,
): string | null {
  const name =
    form.name.trim();

  if (
    name.length < 2 ||
    name.length > 120
  ) {
    return (
      'El nombre debe tener entre ' +
      '2 y 120 caracteres.'
    );
  }

  if (
    form.category.trim().length > 50
  ) {
    return (
      'La categoría no puede exceder ' +
      '50 caracteres.'
    );
  }

  if (
    form.phone.trim().length > 30
  ) {
    return (
      'El teléfono no puede exceder ' +
      '30 caracteres.'
    );
  }

  if (
    form.address.trim().length > 250
  ) {
    return (
      'La dirección no puede exceder ' +
      '250 caracteres.'
    );
  }

  if (
    form.description.trim().length > 500
  ) {
    return (
      'La descripción no puede exceder ' +
      '500 caracteres.'
    );
  }

  return null;
}

export default function AdminSettings() {
  const {
    user,
    updateUser,
  } = useAuth();

  const navigate =
    useNavigate();

  const businessId =
    user?.apiBusinessId;

  const [
    business,
    setBusiness,
  ] =
    useState<Business | null>(null);

  const [
    form,
    setForm,
  ] =
    useState<BusinessForm>(
      EMPTY_FORM,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState<string | null>(null);

  const [
    saveError,
    setSaveError,
  ] =
    useState<string | null>(null);

  const [
    savedMessage,
    setSavedMessage,
  ] =
    useState<string | null>(null);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const loadBusiness =
    useCallback(
      async () => {
        if (!businessId) {
          setBusiness(null);
          setLoadError(
            'No se encontró el negocio asociado a la sesión.',
          );
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setLoadError(null);
          setSavedMessage(null);

          const data =
            await getBusiness(
              businessId,
            );

          setBusiness(data);
          setForm(
            toForm(data),
          );
        } catch (error) {
          setBusiness(null);
          setLoadError(
            getApiError(error),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [businessId],
    );

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  const setField = (
    field: keyof BusinessForm,
    value: string,
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setSaveError(null);
    setSavedMessage(null);
  };

  const handleSubmit =
    async (
      event:
      FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !businessId ||
        !business
      ) {
        setSaveError(
          'No se encontró el negocio asociado.',
        );
        return;
      }

      const validationError =
        validateForm(form);

      if (validationError) {
        setSaveError(
          validationError,
        );
        return;
      }

      const payload:
        BusinessUpdate = {
          name:
            form.name.trim(),

          category:
            optionalValue(
              form.category,
            ),

          phone:
            optionalValue(
              form.phone,
            ),

          address:
            optionalValue(
              form.address,
            ),

          description:
            optionalValue(
              form.description,
            ),
        };

      try {
        setIsSaving(true);
        setSaveError(null);
        setSavedMessage(null);

        const updated =
          await updateBusiness(
            businessId,
            payload,
          );

        setBusiness(updated);
        setForm(
          toForm(updated),
        );

        updateUser({
          businessName:
            updated.name,

          businessAddress:
            updated.address ??
            undefined,

          businessDescription:
            updated.description ??
            undefined,
        });

        setSavedMessage(
          'Los cambios se guardaron en el servidor.',
        );
      } catch (error) {
        setSaveError(
          getApiError(error),
        );
      } finally {
        setIsSaving(false);
      }
    };

  return (
    <AdminLayout>
      <header className="ad__header">
        <div>
          <h1 className="ad__title">
            Configuración
          </h1>

          <p className="as__subtitle">
            Actualiza la información pública
            de tu negocio.
          </p>
        </div>

        <button
          type="button"
          className="ad__btn ad__btn--ghost"
          onClick={() =>
            void loadBusiness()
          }
          disabled={isLoading}
        >
          Actualizar
        </button>
      </header>

      {isLoading && (
        <section
          className="as__state"
          role="status"
        >
          <span className="as__spinner" />

          <p>
            Cargando configuración…
          </p>
        </section>
      )}

      {!isLoading &&
        loadError && (
          <section
            className="as__state as__state--error"
            role="alert"
          >
            <h2>
              No pudimos cargar el negocio
            </h2>

            <p>{loadError}</p>

            <div className="as__state-actions">
              {!businessId && (
                <button
                  type="button"
                  className="ad__btn ad__btn--ghost"
                  onClick={() =>
                    navigate(
                      '/completar-negocio',
                    )
                  }
                >
                  Completar registro
                </button>
              )}

              <button
                type="button"
                className="ad__btn"
                onClick={() =>
                  void loadBusiness()
                }
              >
                Reintentar
              </button>
            </div>
          </section>
        )}

      {!isLoading &&
        !loadError &&
        business && (
          <div className="as__layout">
            <form
              className="as__panel"
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              <div className="as__panel-head">
                <div>
                  <h2 className="as__section-title">
                    Perfil del negocio
                  </h2>

                  <p className="as__hint">
                    Esta información se muestra
                    en el catálogo y en el
                    detalle de tus recursos.
                  </p>
                </div>

                <span
                  className={
                    business.is_active
                      ? 'as__status as__status--active'
                      : 'as__status'
                  }
                >
                  {business.is_active
                    ? 'Negocio activo'
                    : 'Negocio inactivo'}
                </span>
              </div>

              {saveError && (
                <div
                  className="as__message as__message--error"
                  role="alert"
                >
                  {saveError}
                </div>
              )}

              {savedMessage && (
                <div
                  className="as__message as__message--success"
                  role="status"
                >
                  {savedMessage}
                </div>
              )}

              <div className="as__grid">
                <label className="as__field">
                  <span className="as__label">
                    Nombre del negocio
                  </span>

                  <input
                    className="as__input"
                    value={form.name}
                    onChange={(event) =>
                      setField(
                        'name',
                        event.target.value,
                      )
                    }
                    minLength={2}
                    maxLength={120}
                    disabled={isSaving}
                    required
                  />

                  <small>
                    {form.name.length}/120
                  </small>
                </label>

                <label className="as__field">
                  <span className="as__label">
                    Categoría
                  </span>

                  <input
                    className="as__input"
                    value={
                      form.category
                    }
                    onChange={(event) =>
                      setField(
                        'category',
                        event.target.value,
                      )
                    }
                    maxLength={50}
                    placeholder="Ej. Belleza"
                    disabled={isSaving}
                  />

                  <small>
                    {form.category.length}/50
                  </small>
                </label>

                <label className="as__field">
                  <span className="as__label">
                    Teléfono
                  </span>

                  <input
                    className="as__input"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setField(
                        'phone',
                        event.target.value,
                      )
                    }
                    maxLength={30}
                    placeholder="449 000 0000"
                    disabled={isSaving}
                  />

                  <small>
                    {form.phone.length}/30
                  </small>
                </label>

                <label className="as__field">
                  <span className="as__label">
                    Correo del propietario
                  </span>

                  <input
                    className="as__input"
                    type="email"
                    value={
                      user?.email ?? ''
                    }
                    readOnly
                    aria-readonly="true"
                  />

                  <small>
                    El correo pertenece a la
                    cuenta y no al negocio.
                  </small>
                </label>
              </div>

              <label className="as__field">
                <span className="as__label">
                  Dirección
                </span>

                <input
                  className="as__input"
                  value={form.address}
                  onChange={(event) =>
                    setField(
                      'address',
                      event.target.value,
                    )
                  }
                  maxLength={250}
                  placeholder="Calle, número, colonia y ciudad"
                  disabled={isSaving}
                />

                <small>
                  {form.address.length}/250
                </small>
              </label>

              <label className="as__field">
                <span className="as__label">
                  Descripción
                </span>

                <textarea
                  className="as__input as__textarea"
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setField(
                      'description',
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  rows={5}
                  placeholder="Describe tu negocio y los servicios que ofrece."
                  disabled={isSaving}
                />

                <small>
                  {form.description.length}/500
                </small>
              </label>

              <div className="as__actions">
                <button
                  type="button"
                  className="ad__btn ad__btn--ghost"
                  onClick={() =>
                    setForm(
                      toForm(business),
                    )
                  }
                  disabled={isSaving}
                >
                  Descartar cambios
                </button>

                <button
                  type="submit"
                  className="ad__btn"
                  disabled={isSaving}
                >
                  {isSaving
                    ? 'Guardando…'
                    : 'Guardar cambios'}
                </button>
              </div>
            </form>

            <aside className="as__sidebar">
              <section className="as__preview">
                <span className="as__preview-label">
                  Vista previa
                </span>

                <div
                  className="as__preview-avatar"
                  aria-hidden="true"
                >
                  {form.name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                    'R'}
                </div>

                <h2>
                  {form.name.trim() ||
                    'Nombre del negocio'}
                </h2>

                <p className="as__preview-category">
                  {form.category.trim() ||
                    'Sin categoría'}
                </p>

                <p>
                  {form.description.trim() ||
                    'Agrega una descripción para que los clientes conozcan tu negocio.'}
                </p>

                <dl>
                  <div>
                    <dt>Dirección</dt>

                    <dd>
                      {form.address.trim() ||
                        'No disponible'}
                    </dd>
                  </div>

                  <div>
                    <dt>Teléfono</dt>

                    <dd>
                      {form.phone.trim() ||
                        'No disponible'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="as__scope">
                <h2>
                  Alcance de esta versión
                </h2>

                <p>
                  El servidor actual permite
                  administrar el perfil del
                  negocio y sus recursos.
                </p>

                <ul>
                  <li>
                    Perfil público:
                    conectado al servidor.
                  </li>

                  <li>
                    Recursos y precios:
                    disponibles en Recursos.
                  </li>

                  <li>
                    Horarios avanzados,
                    pagos, redes sociales,
                    notificaciones y cambio
                    de contraseña requieren
                    endpoints adicionales.
                  </li>
                </ul>

                <button
                  type="button"
                  className="ad__btn ad__btn--ghost"
                  onClick={() =>
                    navigate(
                      '/admin/recursos',
                    )
                  }
                >
                  Administrar recursos
                </button>
              </section>
            </aside>
          </div>
        )}

      <footer className="ad__footer">
        Configuración del negocio
      </footer>
    </AdminLayout>
  );
}
