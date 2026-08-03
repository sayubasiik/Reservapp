import {
  getBusiness,
  listBusinesses,
} from '../api/businesses';

import {
  getResource,
  listResources,
} from '../api/resources';

import type {
  Business,
  Resource,
} from '../api/types';

export interface CatalogItem {
  resourceId: number;
  businessId: number;

  resourceName: string;
  businessName: string;

  description: string;
  category: string;
  address: string;
  phone: string | null;

  capacity: number;
  pricePerHour: number;
}

function parsePrice(
  value: number | string | null | undefined,
): number {
  const amount = Number(value ?? 0);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return 0;
  }

  return amount;
}

function parseCapacity(
  value: number | null | undefined,
): number {
  if (
    !Number.isInteger(value) ||
    Number(value) < 1
  ) {
    return 1;
  }

  return Number(value);
}

/**
 * Combines one API resource with its business.
 */
export function toCatalogItem(
  resource: Resource,
  business: Business,
): CatalogItem {
  if (
    resource.business_id === null ||
    resource.business_id !== business.id
  ) {
    throw new Error(
      'El recurso no pertenece al negocio indicado.',
    );
  }

  return {
    resourceId: resource.id,
    businessId: business.id,

    resourceName: resource.name,
    businessName: business.name,

    description:
      resource.description?.trim() ||
      business.description?.trim() ||
      '',

    category:
      resource.category?.trim() ||
      business.category?.trim() ||
      'General',

    address:
      business.address?.trim() ||
      'Direccion no disponible',

    phone:
      business.phone?.trim() ||
      null,

    capacity: parseCapacity(
      resource.capacity,
    ),

    pricePerHour: parsePrice(
      resource.price_per_hour,
    ),
  };
}

/**
 * Joins the public resource and business lists.
 *
 * Orphan resources and inactive records are ignored
 * instead of producing incomplete catalog cards.
 */
export function mergeCatalogItems(
  resources: Resource[],
  businesses: Business[],
): CatalogItem[] {
  const businessesById = new Map(
    businesses
      .filter((business) => business.is_active)
      .map((business) => [
        business.id,
        business,
      ]),
  );

  return resources.flatMap((resource) => {
    if (
      !resource.is_active ||
      resource.business_id === null
    ) {
      return [];
    }

    const business = businessesById.get(
      resource.business_id,
    );

    if (!business) {
      return [];
    }

    return [
      toCatalogItem(
        resource,
        business,
      ),
    ];
  });
}

/**
 * Loads the complete public catalog.
 */
export async function listCatalogItems():
Promise<CatalogItem[]> {
  const [
    businesses,
    resources,
  ] = await Promise.all([
    listBusinesses(),
    listResources(),
  ]);

  return mergeCatalogItems(
    resources,
    businesses,
  );
}

/**
 * Loads one catalog item using the resource id.
 */
export async function getCatalogItem(
  resourceId: number,
): Promise<CatalogItem> {
  const resource = await getResource(
    resourceId,
  );

  if (resource.business_id === null) {
    throw new Error(
      'El recurso no tiene un negocio asociado.',
    );
  }

  const business = await getBusiness(
    resource.business_id,
  );

  return toCatalogItem(
    resource,
    business,
  );
}