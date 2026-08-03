import { apiClient } from './client';
import {
  normalizeResource,
  normalizeResources,
} from './normalizers';

import type {
  AvailabilityResponse,
  Resource,
  ResourceCreate,
  ResourceUpdate,
} from './types';

export interface ListResourcesParams {
  category?: string;
  businessId?: number;
}

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

function assertValidDateRange(
  start: string,
  end: string,
): void {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      'La fecha de inicio o fin no es vÃ¡lida.',
    );
  }

  if (endDate <= startDate) {
    throw new Error(
      'La fecha final debe ser posterior a la inicial.',
    );
  }
}

export async function listResources(
  params: ListResourcesParams = {},
): Promise<Resource[]> {
  const category = params.category?.trim();

  if (params.businessId !== undefined) {
    assertPositiveId(
      params.businessId,
      'businessId',
    );
  }

  const response = await apiClient.get<unknown>(
    '/resources/',
    {
      params: {
        category: category || undefined,
        business_id: params.businessId,
      },
    },
  );

  return normalizeResources(response.data);
}

export async function getResource(
  resourceId: number,
): Promise<Resource> {
  assertPositiveId(
    resourceId,
    'resourceId',
  );

  const response = await apiClient.get<unknown>(
    `/resources/${resourceId}`,
  );

  return normalizeResource(response.data);
}

export async function getResourceAvailability(
  resourceId: number,
  start: string,
  end: string,
): Promise<AvailabilityResponse> {
  assertPositiveId(
    resourceId,
    'resourceId',
  );
  assertValidDateRange(start, end);

  const response =
    await apiClient.get<AvailabilityResponse>(
      `/resources/${resourceId}/availability`,
      {
        params: { start, end },
      },
    );

  return response.data;
}

export async function createResource(
  input: ResourceCreate,
): Promise<Resource> {
  assertPositiveId(
    input.business_id,
    'business_id',
  );

  const response = await apiClient.post<unknown>(
    '/resources/',
    input,
  );

  return normalizeResource(response.data);
}

export async function updateResource(
  resourceId: number,
  input: ResourceUpdate,
): Promise<Resource> {
  assertPositiveId(
    resourceId,
    'resourceId',
  );

  const response = await apiClient.patch<unknown>(
    `/resources/${resourceId}`,
    input,
  );

  return normalizeResource(response.data);
}