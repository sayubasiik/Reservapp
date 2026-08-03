import { apiClient } from './client';
import {
  normalizeBusiness,
  normalizeBusinesses,
} from './normalizers';

import type {
  Business,
  BusinessCreate,
  BusinessUpdate,
} from './types';

export interface ListBusinessesParams {
  category?: string;
}

/**
 * Returns the active businesses exposed by the API.
 */
export async function listBusinesses(
  params: ListBusinessesParams = {},
): Promise<Business[]> {
  const category = params.category?.trim();
  const response = await apiClient.get<unknown>(
    '/businesses/',
    {
      params: category
        ? { category }
        : undefined,
    },
  );

  return normalizeBusinesses(response.data);
}

/**
 * Returns one active business by its numeric API id.
 */
export async function getBusiness(
  businessId: number,
): Promise<Business> {
  const response = await apiClient.get<unknown>(
    `/businesses/${businessId}`,
  );

  return normalizeBusiness(response.data);
}

/**
 * Creates a business using the current JWT.
 */
export async function createBusiness(
  input: BusinessCreate,
): Promise<Business> {
  const response = await apiClient.post<unknown>(
    '/businesses/',
    input,
  );

  return normalizeBusiness(response.data);
}

/**
 * Updates a business that belongs to the authenticated owner.
 */
export async function updateBusiness(
  businessId: number,
  input: BusinessUpdate,
): Promise<Business> {
  const response = await apiClient.patch<unknown>(
    `/businesses/${businessId}`,
    input,
  );

  return normalizeBusiness(response.data);
}

/**
 * Finds the active business owned by the authenticated user.
 */
export async function findOwnedBusiness(
  ownerId: number,
): Promise<Business | null> {
  const businesses = await listBusinesses();
  const normalizedOwnerId = Number(ownerId);

  return (
    businesses.find(
      (business) =>
        Number(business.owner_id) ===
        normalizedOwnerId,
    ) ?? null
  );
}