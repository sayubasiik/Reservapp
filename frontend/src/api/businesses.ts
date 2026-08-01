import { apiClient } from './client';

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

  const response = await apiClient.get<Business[]>(
    '/businesses/',
    {
      params: category
        ? {
            category,
          }
        : undefined,
    },
  );

  return response.data;
}

/**
 * Returns one active business by its numeric API id.
 */
export async function getBusiness(
  businessId: number,
): Promise<Business> {
  const response = await apiClient.get<Business>(
    `/businesses/${businessId}`,
  );

  return response.data;
}

/**
 * Creates a business using the current JWT.
 *
 * A business_owner must not send owner_id because the
 * backend assigns the authenticated user automatically.
 */
export async function createBusiness(
  input: BusinessCreate,
): Promise<Business> {
  const response = await apiClient.post<Business>(
    '/businesses/',
    input,
  );

  return response.data;
}

/**
 * Updates a business that belongs to the authenticated owner.
 */
export async function updateBusiness(
  businessId: number,
  input: BusinessUpdate,
): Promise<Business> {
  const response = await apiClient.patch<Business>(
    `/businesses/${businessId}`,
    input,
  );

  return response.data;
}

/**
 * Finds the first active business owned by a specific user.
 *
 * This lets the frontend recover the business id after login
 * from another browser or after local storage is cleared.
 */
export async function findOwnedBusiness(
  ownerId: number,
): Promise<Business | null> {
  const businesses = await listBusinesses();

  return (
    businesses.find(
      (business) =>
        business.owner_id === ownerId,
    ) ?? null
  );
}