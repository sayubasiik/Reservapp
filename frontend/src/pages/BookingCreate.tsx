import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getApiError } from '../api/client';
import {
  createReservation,
} from '../api/reservations';
import {
  getResourceAvailability,
} from '../api/resources';
import type {
  Reservation,
} from '../api/types';
import {
  getCatalogItem,
} from '../catalog/catalog';
import type {
  CatalogItem,
} from '../catalog/catalog';
import Navbar from '../components/Navbar';

import '../styles/variables.css';
import './BookingCreate.css';

interface BookingRange {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  key: string;
}

interface AvailabilityState {
  key: string;
  available: boolean;
}

function localDateValue(
  date: Date,
): string {
  const adjusted = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return adjusted
    .toISOString()
    .slice(0, 10);
}

function tomorrowValue(): string {
  const tomorrow = new Date();
  tomorrow.setDate(
    tomorrow.getDate() + 1,
  );

  return localDateValue(tomorrow);
}

function todayValue(): string {
  return localDateValue(new Date());
}

function buildRange(
  date: string,
  time: string,
  durationHours: number,
): BookingRange {
  if (!date || !time) {
    throw new Error(
      'Selecciona una fecha y una hora.',
    );
  }

  if (
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > 8
  ) {
    throw new Error(
      'La duración debe estar entre 1 y 8 horas.',
    );
  }

  const startDate =
    new Date(`${date}T${time}:00`);

  if (
    Number.isNaN(
      startDate.getTime(),
    )
  ) {
    throw new Error(
      'La fecha u hora seleccionada no es válida.',
    );
  }

  if (startDate <= new Date()) {
    throw new Error(
      'Selecciona un horario futuro.',
    );
  }

  const endDate =
    new Date(
      startDate.getTime() +
        durationHours *
          60 *
          60 *
          1_000,
    );

  const startTime =
    startDate.toISOString();

  const endTime =
    endDate.toISOString();

  return {
    startTime,
    endTime,
    startDate,
    endDate,
    key: `${startTime}|${endTime}`,
  };
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(value);
}

function formatDateTime(
  value: string | Date,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'full',
      timeStyle: 'short',
    },
  ).format(date);
}

export default function BookingCreate() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const resourceId = Number(id);

  const validId =
    Number.isInteger(resourceId) &&
    resourceId > 0;

  const [item, setItem] =
    useState<CatalogItem | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [date, setDate] =
    useState(tomorrowValue);

  const [time, setTime] =
    useState('10:00');

  const [duration, setDuration] =
    useState('1');

  const [notes, setNotes] =
    useState('');

  const [
    availability,
    setAvailability,
  ] =
    useState<AvailabilityState | null>(
      null,
    );

  const [
    availabilityError,
    setAvailabilityError,
  ] =
    useState<string | null>(null);

  const [isChecking, setIsChecking] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    createdReservation,
    setCreatedReservation,
  ] =
    useState<Reservation | null>(null);

  const loadItem =
    useCallback(
      async () => {
        if (!validId) {
          setLoadError(
            'El identificador del servicio no es válido.',
          );
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setLoadError(null);

          const data =
            await getCatalogItem(
              resourceId,
            );

          setItem(data);
        } catch (error) {
          setItem(null);
          setLoadError(
            getApiError(error),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        resourceId,
        validId,
      ],
    );

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const durationHours =
    Number(duration);

  const estimatedTotal =
    useMemo(
      () =>
        item &&
        Number.isFinite(
          durationHours,
        )
          ? item.pricePerHour *
            durationHours
          : 0,
      [
        item,
        durationHours,
      ],
    );

  const clearAvailability = () => {
    setAvailability(null);
    setAvailabilityError(null);
  };

  const currentRange = () =>
    buildRange(
      date,
      time,
      durationHours,
    );

  const checkAvailability =
    async (): Promise<
      BookingRange | null
    > => {
      if (!item) {
        setAvailabilityError(
          'No se encontró el recurso.',
        );
        return null;
      }

      try {
        setIsChecking(true);
        setAvailabilityError(null);

        const range =
          currentRange();

        const response =
          await getResourceAvailability(
            item.resourceId,
            range.startTime,
            range.endTime,
          );

        setAvailability({
          key: range.key,
          available:
            response.available,
        });

        if (!response.available) {
          setAvailabilityError(
            'Ese horario ya está ocupado. Elige otro.',
          );
          return null;
        }

        return range;
      } catch (error) {
        setAvailability(null);
        setAvailabilityError(
          getApiError(error),
        );
        return null;
      } finally {
        setIsChecking(false);
      }
    };

  const handleSubmit =
    async (
      event:
      FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!item) {
        return;
      }

      setAvailabilityError(null);

      let range: BookingRange;

      try {
        range = currentRange();
      } catch (error) {
        setAvailability(null);
        setAvailabilityError(
          getApiError(error),
        );
        return;
      }

      if (
        !availability ||
        availability.key !==
          range.key ||
        !availability.available
      ) {
        const checkedRange =
          await checkAvailability();

        if (!checkedRange) {
          return;
        }

        range = checkedRange;
      }

      try {
        setIsSubmitting(true);

        const reservation =
          await createReservation({
            resource_id:
              item.resourceId,
            start_time:
              range.startTime,
            end_time:
              range.endTime,
            notes:
              notes.trim() || null,
          });

        setCreatedReservation(
          reservation,
        );
      } catch (error) {
        setAvailability(null);
        setAvailabilityError(
          getApiError(error),
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (
    !isLoading &&
    createdReservation &&
    item
  ) {
    return (
      <div className="bk">
        <Navbar active="Reservas" />

        <main className="bk__container">
          <section className="bk__success">
            <div
              className="bk__success-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <h1>
              Reserva confirmada
            </h1>

            <p>
              La reservación se guardó
              correctamente en el sistema.
            </p>

            <div className="bk__success-card">
              <div>
                <span>Servicio</span>
                <strong>
                  {item.resourceName}
                </strong>
              </div>

              <div>
                <span>Negocio</span>
                <strong>
                  {item.businessName}
                </strong>
              </div>

              <div>
                <span>Inicio</span>
                <strong>
                  {formatDateTime(
                    createdReservation
                      .start_time,
                  )}
                </strong>
              </div>

              <div>
                <span>Fin</span>
                <strong>
                  {formatDateTime(
                    createdReservation
                      .end_time,
                  )}
                </strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>
                  Confirmada
                </strong>
              </div>

              <div>
                <span>Folio</span>
                <strong>
                  #{createdReservation.id}
                </strong>
              </div>
            </div>

            <div className="bk__success-actions">
              <button
                type="button"
                className="bk__secondary-btn"
                onClick={() =>
                  navigate('/buscar')
                }
              >
                Reservar otro servicio
              </button>

              <button
                type="button"
                className="bk__primary-btn"
                onClick={() =>
                  navigate('/inicio')
                }
              >
                Ir al inicio
              </button>
            </div>

            <p className="bk__success-note">
              En el siguiente bloque
              conectaremos “Mis reservas”
              para consultar y cancelar esta
              reservación desde la interfaz.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bk">
      <Navbar active="Reservas" />

      <main className="bk__container">
        {isLoading && (
          <section
            className="bk__state"
            role="status"
          >
            <span className="bk__spinner" />
            <p>
              Preparando la reservación…
            </p>
          </section>
        )}

        {!isLoading &&
          loadError && (
            <section
              className="bk__state bk__state--error"
              role="alert"
            >
              <h1>
                No pudimos abrir la
                reservación
              </h1>

              <p>{loadError}</p>

              <div className="bk__state-actions">
                <button
                  type="button"
                  className="bk__secondary-btn"
                  onClick={() =>
                    navigate('/buscar')
                  }
                >
                  Volver a buscar
                </button>

                {validId && (
                  <button
                    type="button"
                    className="bk__primary-btn"
                    onClick={() =>
                      void loadItem()
                    }
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </section>
          )}

        {!isLoading &&
          !loadError &&
          item && (
            <>
              <button
                type="button"
                className="bk__back"
                onClick={() =>
                  navigate(
                    `/servicio/${item.resourceId}`,
                  )
                }
              >
                ← Volver al servicio
              </button>

              <header className="bk__header">
                <span className="bk__business">
                  {item.businessName}
                </span>

                <h1>
                  Reservar{' '}
                  {item.resourceName}
                </h1>

                <p>
                  Selecciona un horario futuro.
                  Antes de confirmar,
                  verificaremos que siga
                  disponible.
                </p>
              </header>

              <div className="bk__layout">
                <form
                  className="bk__form"
                  onSubmit={
                    handleSubmit
                  }
                  noValidate
                >
                  <div className="bk__field-grid">
                    <label className="bk__field">
                      <span>Fecha</span>

                      <input
                        type="date"
                        min={todayValue()}
                        value={date}
                        onChange={(event) => {
                          setDate(
                            event.target.value,
                          );
                          clearAvailability();
                        }}
                        disabled={
                          isChecking ||
                          isSubmitting
                        }
                      />
                    </label>

                    <label className="bk__field">
                      <span>Hora de inicio</span>

                      <input
                        type="time"
                        value={time}
                        onChange={(event) => {
                          setTime(
                            event.target.value,
                          );
                          clearAvailability();
                        }}
                        disabled={
                          isChecking ||
                          isSubmitting
                        }
                      />
                    </label>

                    <label className="bk__field">
                      <span>Duración</span>

                      <select
                        value={duration}
                        onChange={(event) => {
                          setDuration(
                            event.target.value,
                          );
                          clearAvailability();
                        }}
                        disabled={
                          isChecking ||
                          isSubmitting
                        }
                      >
                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                          6,
                          7,
                          8,
                        ].map(
                          (hours) => (
                            <option
                              key={hours}
                              value={hours}
                            >
                              {hours}{' '}
                              {hours === 1
                                ? 'hora'
                                : 'horas'}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>

                  <label className="bk__field">
                    <span>
                      Notas opcionales
                    </span>

                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value,
                        )
                      }
                      maxLength={500}
                      rows={4}
                      placeholder="Indicaciones para el negocio"
                      disabled={
                        isChecking ||
                        isSubmitting
                      }
                    />

                    <small>
                      {notes.length}/500
                    </small>
                  </label>

                  {availabilityError && (
                    <div
                      className="bk__message bk__message--error"
                      role="alert"
                    >
                      {availabilityError}
                    </div>
                  )}

                  {availability?.available &&
                    !availabilityError && (
                      <div
                        className="bk__message bk__message--success"
                        role="status"
                      >
                        El horario está
                        disponible.
                      </div>
                    )}

                  <div className="bk__actions">
                    <button
                      type="button"
                      className="bk__secondary-btn"
                      onClick={() =>
                        void checkAvailability()
                      }
                      disabled={
                        isChecking ||
                        isSubmitting
                      }
                    >
                      {isChecking
                        ? 'Comprobando…'
                        : 'Comprobar disponibilidad'}
                    </button>

                    <button
                      type="submit"
                      className="bk__primary-btn"
                      disabled={
                        isChecking ||
                        isSubmitting
                      }
                    >
                      {isSubmitting
                        ? 'Confirmando…'
                        : 'Confirmar reserva'}
                    </button>
                  </div>
                </form>

                <aside className="bk__summary">
                  <h2>
                    Resumen
                  </h2>

                  <dl>
                    <div>
                      <dt>Negocio</dt>
                      <dd>
                        {item.businessName}
                      </dd>
                    </div>

                    <div>
                      <dt>Servicio</dt>
                      <dd>
                        {item.resourceName}
                      </dd>
                    </div>

                    <div>
                      <dt>Dirección</dt>
                      <dd>
                        {item.address}
                      </dd>
                    </div>

                    <div>
                      <dt>Capacidad</dt>
                      <dd>
                        {item.capacity}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Precio por hora
                      </dt>
                      <dd>
                        {formatCurrency(
                          item.pricePerHour,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Total estimado
                      </dt>
                      <dd>
                        {formatCurrency(
                          estimatedTotal,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <p className="bk__summary-note">
                    La API actual registra la
                    reserva, pero no procesa
                    pagos. El precio se muestra
                    únicamente como referencia.
                  </p>
                </aside>
              </div>
            </>
          )}
      </main>

      <footer className="bk__footer">
        reservapp.com/reservar
      </footer>
    </div>
  );
}
