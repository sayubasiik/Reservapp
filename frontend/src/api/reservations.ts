import { apiClient } from './client';

import type {
  Reservation,
  ReservationCreate,
} from './types';

function assertPositiveId(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} debe ser un entero positivo.`,
    );
  }
}

function assertDateRange(
  startTime: string,
  endTime: string,
): void {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error(
      'La fecha de inicio o fin no es válida.',
    );
  }

  if (end <= start) {
    throw new Error(
      'La fecha final debe ser posterior a la inicial.',
    );
  }

  if (start <= new Date()) {
    throw new Error(
      'La reservación debe iniciar en una fecha futura.',
    );
  }
}

/**
 * Creates a confirmed reservation using the current JWT.
 */
export async function createReservation(
  input: ReservationCreate,
): Promise<Reservation> {
  assertPositiveId(
    input.resource_id,
    'resource_id',
  );

  assertDateRange(
    input.start_time,
    input.end_time,
  );

  const response =
    await apiClient.post<Reservation>(
      '/reservations/',
      input,
    );

  return response.data;
}

/**
 * Returns every reservation owned by the authenticated user.
 */
export async function listMyReservations():
Promise<Reservation[]> {
  const response =
    await apiClient.get<Reservation[]>(
      '/reservations/me',
    );

  return response.data;
}

/**
 * Cancels one reservation owned by the authenticated user.
 */
export async function cancelReservation(
  reservationId: number,
): Promise<Reservation> {
  assertPositiveId(
    reservationId,
    'reservationId',
  );

  const response =
    await apiClient.delete<Reservation>(
      `/reservations/${reservationId}`,
    );

  return response.data;
}
