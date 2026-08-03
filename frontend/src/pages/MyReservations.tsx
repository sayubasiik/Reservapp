import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiError } from '../api/client';
import {
  cancelReservation,
  listMyReservations,
} from '../api/reservations';

import type {
  Reservation,
} from '../api/types';

import {
  listCatalogItems,
} from '../catalog/catalog';

import type {
  CatalogItem,
} from '../catalog/catalog';

import Modal from '../components/Modal';
import Navbar from '../components/Navbar';

import '../styles/variables.css';
import './MyReservations.css';

type ReservationTab =
  | 'upcoming'
  | 'past'
  | 'cancelled';

interface ReservationView {
  reservation: Reservation;
  catalogItem: CatalogItem | null;
  resourceName: string;
  businessName: string;
  address: string;
  category: string;
  pricePerHour: number;
}

const TABS: Array<{
  key: ReservationTab;
  label: string;
}> = [
  {
    key: 'upcoming',
    label: 'Próximas',
  },
  {
    key: 'past',
    label: 'Anteriores',
  },
  {
    key: 'cancelled',
    label: 'Canceladas',
  },
];

function normalizedStatus(
  status: string,
): string {
  return status
    .trim()
    .toLowerCase();
}

function reservationGroup(
  reservation: Reservation,
  now: number,
): ReservationTab {
  const status = normalizedStatus(
    reservation.status,
  );

  if (status === 'cancelled') {
    return 'cancelled';
  }

  if (
    status === 'completed' ||
    new Date(
      reservation.end_time,
    ).getTime() < now
  ) {
    return 'past';
  }

  return 'upcoming';
}

function statusLabel(
  status: string,
): string {
  switch (
    normalizedStatus(status)
  ) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    case 'completed':
      return 'Completada';
    default:
      return status || 'Sin estado';
  }
}

function statusClass(
  status: string,
): string {
  const normalized =
    normalizedStatus(status);

  if (
    normalized === 'pending' ||
    normalized === 'confirmed' ||
    normalized === 'cancelled' ||
    normalized === 'completed'
  ) {
    return normalized;
  }

  return 'unknown';
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'full',
    },
  ).format(new Date(value));
}

function formatTimeRange(
  startTime: string,
  endTime: string,
): string {
  const formatter =
    new Intl.DateTimeFormat(
      'es-MX',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  return (
    `${formatter.format(
      new Date(startTime),
    )} – ${formatter.format(
      new Date(endTime),
    )}`
  );
}

function durationLabel(
  startTime: string,
  endTime: string,
): string {
  const milliseconds =
    new Date(endTime).getTime() -
    new Date(startTime).getTime();

  const totalMinutes =
    Math.max(
      0,
      Math.round(
        milliseconds / 60_000,
      ),
    );

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  if (
    hours > 0 &&
    minutes > 0
  ) {
    return `${hours} h ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} ${
      hours === 1
        ? 'hora'
        : 'horas'
    }`;
  }

  return `${minutes} min`;
}

function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
): number {
  const parsed = Number(
    value ?? 0,
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(
  value: number,
): string {
  if (value === 0) {
    return 'Sin costo';
  }

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(value);
}

function canCancel(
  reservation: Reservation,
): boolean {
  const status =
    normalizedStatus(
      reservation.status,
    );

  const isActive =
    status === 'pending' ||
    status === 'confirmed';

  return (
    isActive &&
    new Date(
      reservation.start_time,
    ).getTime() >
      Date.now()
  );
}

function toReservationView(
  reservation: Reservation,
  catalogByResource:
    Map<number, CatalogItem>,
): ReservationView {
  const catalogItem =
    catalogByResource.get(
      reservation.resource_id,
    ) ?? null;

  const resource =
    reservation.resource ?? null;

  return {
    reservation,
    catalogItem,

    resourceName:
      catalogItem?.resourceName ||
      resource?.name ||
      `Recurso #${reservation.resource_id}`,

    businessName:
      catalogItem?.businessName ||
      'Negocio no disponible',

    address:
      catalogItem?.address ||
      'Dirección no disponible',

    category:
      catalogItem?.category ||
      resource?.category ||
      'General',

    pricePerHour:
      catalogItem?.pricePerHour ??
      numberValue(
        resource?.price_per_hour,
      ),
  };
}

export default function MyReservations() {
  const [tab, setTab] =
    useState<ReservationTab>(
      'upcoming',
    );

  const [
    reservations,
    setReservations,
  ] =
    useState<Reservation[]>([]);

  const [
    catalogItems,
    setCatalogItems,
  ] =
    useState<CatalogItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [
    metadataWarning,
    setMetadataWarning,
  ] =
    useState<string | null>(null);

  const [
    notice,
    setNotice,
  ] =
    useState<string | null>(null);

  const [
    selectedReservation,
    setSelectedReservation,
  ] =
    useState<ReservationView | null>(
      null,
    );

  const [
    cancelError,
    setCancelError,
  ] =
    useState<string | null>(null);

  const [
    isCancelling,
    setIsCancelling,
  ] =
    useState(false);

  const loadReservations =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setLoadError(null);
          setMetadataWarning(null);
          setNotice(null);

          const [
            reservationsResult,
            catalogResult,
          ] =
            await Promise.allSettled([
              listMyReservations(),
              listCatalogItems(),
            ]);

          if (
            reservationsResult.status ===
            'rejected'
          ) {
            throw reservationsResult.reason;
          }

          setReservations(
            reservationsResult.value,
          );

          if (
            catalogResult.status ===
            'fulfilled'
          ) {
            setCatalogItems(
              catalogResult.value,
            );
          } else {
            setCatalogItems([]);
            setMetadataWarning(
              'Las reservas se cargaron, pero algunos datos del negocio no están disponibles temporalmente.',
            );
          }
        } catch (error) {
          setReservations([]);
          setCatalogItems([]);
          setLoadError(
            getApiError(error),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const catalogByResource =
    useMemo(
      () =>
        new Map(
          catalogItems.map(
            (item) => [
              item.resourceId,
              item,
            ],
          ),
        ),
      [catalogItems],
    );

  const views =
    useMemo(
      () =>
        reservations.map(
          (reservation) =>
            toReservationView(
              reservation,
              catalogByResource,
            ),
        ),
      [
        reservations,
        catalogByResource,
      ],
    );

  const groupedViews =
    useMemo(
      () => {
        const now = Date.now();

        const grouped:
          Record<
            ReservationTab,
            ReservationView[]
          > = {
            upcoming: [],
            past: [],
            cancelled: [],
          };

        views.forEach((view) => {
          grouped[
            reservationGroup(
              view.reservation,
              now,
            )
          ].push(view);
        });

        grouped.upcoming.sort(
          (left, right) =>
            new Date(
              left.reservation
                .start_time,
            ).getTime() -
            new Date(
              right.reservation
                .start_time,
            ).getTime(),
        );

        grouped.past.sort(
          (left, right) =>
            new Date(
              right.reservation
                .start_time,
            ).getTime() -
            new Date(
              left.reservation
                .start_time,
            ).getTime(),
        );

        grouped.cancelled.sort(
          (left, right) =>
            new Date(
              right.reservation
                .start_time,
            ).getTime() -
            new Date(
              left.reservation
                .start_time,
            ).getTime(),
        );

        return grouped;
      },
      [views],
    );

  const activeList =
    groupedViews[tab];

  const openCancellation = (
    view: ReservationView,
  ) => {
    setSelectedReservation(view);
    setCancelError(null);
    setNotice(null);
  };

  const closeCancellation = () => {
    if (isCancelling) {
      return;
    }

    setSelectedReservation(null);
    setCancelError(null);
  };

  const confirmCancellation =
    async () => {
      if (!selectedReservation) {
        return;
      }

      try {
        setIsCancelling(true);
        setCancelError(null);

        const cancelled =
          await cancelReservation(
            selectedReservation
              .reservation.id,
          );

        setReservations(
          (current) =>
            current.map(
              (reservation) =>
                reservation.id ===
                cancelled.id
                  ? cancelled
                  : reservation,
            ),
        );

        setSelectedReservation(null);
        setTab('cancelled');
        setNotice(
          `La reserva #${cancelled.id} fue cancelada correctamente.`,
        );
      } catch (error) {
        setCancelError(
          getApiError(error),
        );
      } finally {
        setIsCancelling(false);
      }
    };

  return (
    <div className="mr">
      <Navbar active="Reservas" />

      <main className="mr__container">
        <header className="mr__header">
          <div>
            <h1 className="mr__title">
              Mis reservas
            </h1>

            <p className="mr__subtitle">
              Consulta tus próximas visitas,
              el historial y las reservas
              canceladas.
            </p>
          </div>

          <button
            type="button"
            className="mr__refresh"
            onClick={() =>
              void loadReservations()
            }
            disabled={isLoading}
          >
            Actualizar
          </button>
        </header>

        {notice && (
          <div
            className="mr__notice"
            role="status"
          >
            {notice}
          </div>
        )}

        {metadataWarning && (
          <div
            className="mr__warning"
            role="status"
          >
            {metadataWarning}
          </div>
        )}

        {!isLoading &&
          !loadError && (
            <div
              className="mr__tabs"
              aria-label="Filtrar reservaciones"
            >
              {TABS.map(
                (item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={
                      `mr__tab ${
                        tab === item.key
                          ? 'is-active'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setTab(item.key)
                    }
                  >
                    {item.label}

                    <span className="mr__tab-count">
                      {
                        groupedViews[
                          item.key
                        ].length
                      }
                    </span>
                  </button>
                ),
              )}
            </div>
          )}

        {isLoading && (
          <section
            className="mr__state"
            role="status"
          >
            <span className="mr__spinner" />

            <p>
              Cargando tus reservas…
            </p>
          </section>
        )}

        {!isLoading &&
          loadError && (
            <section
              className="mr__state mr__state--error"
              role="alert"
            >
              <h2>
                No pudimos cargar tus reservas
              </h2>

              <p>{loadError}</p>

              <button
                type="button"
                className="mr__primary-btn"
                onClick={() =>
                  void loadReservations()
                }
              >
                Reintentar
              </button>
            </section>
          )}

        {!isLoading &&
          !loadError &&
          reservations.length === 0 && (
            <section className="mr__state">
              <h2>
                Aún no tienes reservas
              </h2>

              <p>
                Cuando confirmes un servicio,
                aparecerá en esta sección.
              </p>

              <a
                className="mr__primary-link"
                href="/buscar"
              >
                Buscar servicios
              </a>
            </section>
          )}

        {!isLoading &&
          !loadError &&
          reservations.length > 0 &&
          activeList.length === 0 && (
            <section className="mr__state">
              <h2>
                No hay reservas en esta sección
              </h2>

              <p>
                Selecciona otra pestaña para
                consultar el resto de tu
                historial.
              </p>
            </section>
          )}

        {!isLoading &&
          !loadError &&
          activeList.length > 0 && (
            <section className="mr__list">
              {activeList.map(
                (view) => {
                  const {
                    reservation,
                  } = view;

                  const duration =
                    durationLabel(
                      reservation.start_time,
                      reservation.end_time,
                    );

                  const estimatedTotal =
                    view.pricePerHour *
                    Math.max(
                      0,
                      (
                        new Date(
                          reservation
                            .end_time,
                        ).getTime() -
                        new Date(
                          reservation
                            .start_time,
                        ).getTime()
                      ) /
                        3_600_000,
                    );

                  return (
                    <article
                      className="mr__item"
                      key={reservation.id}
                    >
                      <div
                        className="mr__visual"
                        aria-hidden="true"
                      >
                        <span>
                          {view.category
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                            'R'}
                        </span>
                      </div>

                      <div className="mr__item-body">
                        <div className="mr__item-heading">
                          <div>
                            <span className="mr__business">
                              {view.businessName}
                            </span>

                            <h2 className="mr__item-name">
                              {view.resourceName}
                            </h2>
                          </div>

                          <span
                            className={
                              `mr__badge mr__badge--${statusClass(
                                reservation.status,
                              )}`
                            }
                          >
                            {statusLabel(
                              reservation.status,
                            )}
                          </span>
                        </div>

                        <dl className="mr__details">
                          <div>
                            <dt>Fecha</dt>

                            <dd>
                              {formatDate(
                                reservation
                                  .start_time,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt>Horario</dt>

                            <dd>
                              {formatTimeRange(
                                reservation
                                  .start_time,
                                reservation
                                  .end_time,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt>Duración</dt>

                            <dd>{duration}</dd>
                          </div>

                          <div>
                            <dt>Folio</dt>

                            <dd>
                              #{reservation.id}
                            </dd>
                          </div>

                          <div>
                            <dt>Dirección</dt>

                            <dd>
                              {view.address}
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

                        {reservation.notes && (
                          <div className="mr__notes">
                            <strong>
                              Notas
                            </strong>

                            <p>
                              {
                                reservation.notes
                              }
                            </p>
                          </div>
                        )}

                        <div className="mr__actions">
                          <a
                            className="mr__secondary-link"
                            href={
                              `/servicio/${reservation.resource_id}`
                            }
                          >
                            Ver servicio
                          </a>

                          {canCancel(
                            reservation,
                          ) && (
                            <button
                              type="button"
                              className="mr__cancel-btn"
                              onClick={() =>
                                openCancellation(
                                  view,
                                )
                              }
                            >
                              Cancelar reserva
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </section>
          )}
      </main>

      <Modal
        open={
          selectedReservation !== null
        }
        title="Cancelar reserva"
        onClose={closeCancellation}
      >
        {selectedReservation && (
          <div className="mr__cancel-modal">
            <p>
              Vas a cancelar la reserva de
              <strong>
                {' '}
                {
                  selectedReservation
                    .resourceName
                }
              </strong>
              .
            </p>

            <dl>
              <div>
                <dt>Fecha</dt>

                <dd>
                  {formatDate(
                    selectedReservation
                      .reservation
                      .start_time,
                  )}
                </dd>
              </div>

              <div>
                <dt>Horario</dt>

                <dd>
                  {formatTimeRange(
                    selectedReservation
                      .reservation
                      .start_time,
                    selectedReservation
                      .reservation
                      .end_time,
                  )}
                </dd>
              </div>

              <div>
                <dt>Folio</dt>

                <dd>
                  #
                  {
                    selectedReservation
                      .reservation.id
                  }
                </dd>
              </div>
            </dl>

            <p className="mr__cancel-question">
              Esta acción cambiará el estado a
              cancelada. ¿Deseas continuar?
            </p>

            {cancelError && (
              <div
                className="mr__cancel-error"
                role="alert"
              >
                {cancelError}
              </div>
            )}

            <div className="mr__modal-actions">
              <button
                type="button"
                className="mr__secondary-btn"
                onClick={closeCancellation}
                disabled={isCancelling}
              >
                Conservar reserva
              </button>

              <button
                type="button"
                className="mr__danger-btn"
                onClick={() =>
                  void confirmCancellation()
                }
                disabled={isCancelling}
              >
                {isCancelling
                  ? 'Cancelando…'
                  : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <footer className="mr__footer">
        reservapp.com/mis-reservas
      </footer>
    </div>
  );
}
