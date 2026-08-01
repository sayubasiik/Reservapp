import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FormEvent } from 'react';

import { getApiError } from '../api/client';
import {
  createResource,
  listResources,
  updateResource,
} from '../api/resources';
import type { Resource } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import '../styles/variables.css';
import './AdminResources.css';

interface ResourceForm {
  name: string;
  description: string;
  category: string;
  capacity: string;
  pricePerHour: string;
}

const EMPTY_FORM: ResourceForm = {
  name: '',
  description: '',
  category: '',
  capacity: '1',
  pricePerHour: '0',
};

function toForm(resource: Resource): ResourceForm {
  return {
    name: resource.name,
    description: resource.description ?? '',
    category: resource.category ?? '',
    capacity: String(resource.capacity ?? 1),
    pricePerHour: String(
      resource.price_per_hour ?? 0,
    ),
  };
}

function formatPrice(
  value: number | string | null | undefined,
): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export default function AdminResources() {
  const { user } = useAuth();
  const businessId = user?.apiBusinessId;

  const [resources, setResources] =
    useState<Resource[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);
  const [modalOpen, setModalOpen] =
    useState(false);
  const [editing, setEditing] =
    useState<Resource | null>(null);
  const [form, setForm] =
    useState<ResourceForm>(EMPTY_FORM);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [isSaving, setIsSaving] =
    useState(false);

  const loadResources = useCallback(
    async () => {
      if (!businessId) {
        setResources([]);
        setLoadError(
          'No se encontró el negocio asociado a la sesión.',
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        const data = await listResources({
          businessId,
        });

        setResources(data);
      } catch (error) {
        setLoadError(getApiError(error));
      } finally {
        setIsLoading(false);
      }
    },
    [businessId],
  );

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const totals = useMemo(() => {
    const totalCapacity = resources.reduce(
      (sum, resource) =>
        sum + (resource.capacity ?? 0),
      0,
    );

    return {
      resources: resources.length,
      totalCapacity,
    };
  }, [resources]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (resource: Resource) => {
    setEditing(resource);
    setForm(toForm(resource));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const setField = (
    field: keyof ResourceForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    if (!businessId) {
      setFormError(
        'No se encontró el negocio asociado a la sesión.',
      );
      return;
    }

    const name = form.name.trim();
    const description =
      form.description.trim();
    const category = form.category.trim();
    const capacity = Number(form.capacity);
    const pricePerHour =
      Number(form.pricePerHour);

    if (name.length < 2) {
      setFormError(
        'El nombre debe tener al menos 2 caracteres.',
      );
      return;
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      setFormError(
        'La capacidad debe ser un entero mayor o igual a 1.',
      );
      return;
    }

    if (
      !Number.isFinite(pricePerHour) ||
      pricePerHour < 0
    ) {
      setFormError(
        'El precio debe ser un número mayor o igual a 0.',
      );
      return;
    }

    const payload = {
      name,
      description: description || null,
      category: category || null,
      capacity,
      price_per_hour: pricePerHour,
    };

    try {
      setIsSaving(true);

      if (editing) {
        const updated = await updateResource(
          editing.id,
          payload,
        );

        setResources((current) =>
          current.map((resource) =>
            resource.id === updated.id
              ? updated
              : resource,
          ),
        );
      } else {
        const created = await createResource({
          ...payload,
          business_id: businessId,
        });

        setResources((current) => [
          ...current,
          created,
        ]);
      }

      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(getApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <header className="ad__header">
        <div>
          <h1 className="ad__title">
            Recursos
          </h1>

          <p className="ar__subtitle">
            Administra los espacios, servicios o
            unidades que tus clientes podrán
            reservar.
          </p>
        </div>

        <div className="ad__header-actions">
          <button
            type="button"
            className="ad__btn ad__btn--ghost"
            onClick={() => void loadResources()}
            disabled={isLoading}
          >
            Actualizar
          </button>

          <button
            type="button"
            className="ad__btn"
            onClick={openCreate}
            disabled={!businessId}
          >
            Nuevo recurso
          </button>
        </div>
      </header>

      <section className="ar__stats">
        <article className="ar__stat">
          <span className="ar__stat-label">
            Recursos activos
          </span>

          <strong className="ar__stat-value">
            {totals.resources}
          </strong>
        </article>

        <article className="ar__stat">
          <span className="ar__stat-label">
            Capacidad total
          </span>

          <strong className="ar__stat-value">
            {totals.totalCapacity}
          </strong>
        </article>
      </section>

      <section className="ar__panel">
        <div className="ar__panel-head">
          <div>
            <h2 className="ar__panel-title">
              Recursos publicados
            </h2>

            <p className="ar__hint">
              Consulta, crea y actualiza los recursos
              disponibles de tu negocio.
            </p>
          </div>
        </div>

        {isLoading && (
          <div
            className="ar__state"
            role="status"
          >
            Cargando recursos…
          </div>
        )}

        {!isLoading && loadError && (
          <div
            className="ar__state ar__state--error"
            role="alert"
          >
            <p>{loadError}</p>

            <button
              type="button"
              className="ad__btn ad__btn--ghost"
              onClick={() => void loadResources()}
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          resources.length === 0 && (
            <div className="ar__state">
              <h3>Aún no hay recursos</h3>

              <p>
                Crea el primer recurso para que
                después pueda aparecer en el
                catálogo del cliente.
              </p>

              <button
                type="button"
                className="ad__btn"
                onClick={openCreate}
              >
                Crear primer recurso
              </button>
            </div>
          )}

        {!isLoading &&
          !loadError &&
          resources.length > 0 && (
            <div className="ar__grid">
              {resources.map((resource) => (
                <article
                  className="ar__card"
                  key={resource.id}
                >
                  <div className="ar__card-head">
                    <div>
                      <h3 className="ar__card-title">
                        {resource.name}
                      </h3>

                      <span className="ar__badge">
                        Activo
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ar__edit"
                      onClick={() =>
                        openEdit(resource)
                      }
                    >
                      Editar
                    </button>
                  </div>

                  <p className="ar__description">
                    {resource.description ||
                      'Sin descripción.'}
                  </p>

                  <dl className="ar__details">
                    <div>
                      <dt>Categoría</dt>
                      <dd>
                        {resource.category ||
                          'Sin categoría'}
                      </dd>
                    </div>

                    <div>
                      <dt>Capacidad</dt>
                      <dd>
                        {resource.capacity ?? 1}
                      </dd>
                    </div>

                    <div>
                      <dt>Precio por hora</dt>
                      <dd>
                        {formatPrice(
                          resource.price_per_hour,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
      </section>

      <Modal
        open={modalOpen}
        title={
          editing
            ? 'Editar recurso'
            : 'Nuevo recurso'
        }
        onClose={closeModal}
        width={620}
      >
        <form
          className="ar__form"
          onSubmit={handleSubmit}
          noValidate
        >
          {formError && (
            <div
              className="ar__form-error"
              role="alert"
            >
              {formError}
            </div>
          )}

          <label className="ar__field">
            <span>Nombre</span>

            <input
              value={form.name}
              onChange={(event) =>
                setField(
                  'name',
                  event.target.value,
                )
              }
              maxLength={120}
              disabled={isSaving}
              autoFocus
            />
          </label>

          <label className="ar__field">
            <span>Descripción</span>

            <textarea
              value={form.description}
              onChange={(event) =>
                setField(
                  'description',
                  event.target.value,
                )
              }
              maxLength={500}
              rows={3}
              disabled={isSaving}
            />
          </label>

          <div className="ar__form-grid">
            <label className="ar__field">
              <span>Categoría</span>

              <input
                value={form.category}
                onChange={(event) =>
                  setField(
                    'category',
                    event.target.value,
                  )
                }
                maxLength={50}
                placeholder="Ej. Sala, Cancha, Mesa"
                disabled={isSaving}
              />
            </label>

            <label className="ar__field">
              <span>Capacidad</span>

              <input
                type="number"
                min="1"
                step="1"
                value={form.capacity}
                onChange={(event) =>
                  setField(
                    'capacity',
                    event.target.value,
                  )
                }
                disabled={isSaving}
              />
            </label>

            <label className="ar__field">
              <span>Precio por hora (MXN)</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerHour}
                onChange={(event) =>
                  setField(
                    'pricePerHour',
                    event.target.value,
                  )
                }
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="ar__form-actions">
            <button
              type="button"
              className="ad__btn ad__btn--ghost"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="ad__btn"
              disabled={isSaving}
            >
              {isSaving
                ? 'Guardando…'
                : editing
                  ? 'Guardar cambios'
                  : 'Crear recurso'}
            </button>
          </div>
        </form>
      </Modal>

      <footer className="ad__footer">
        Recursos administrables del negocio
      </footer>
    </AdminLayout>
  );
}
