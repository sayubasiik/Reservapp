import type {
  Business,
  Resource,
} from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unwrapObject(
  value: unknown,
  keys: string[],
): UnknownRecord {
  if (isRecord(value)) {
    for (const key of keys) {
      const nested = value[key];
      if (isRecord(nested)) {
        return nested;
      }
    }
    return value;
  }

  throw new Error(
    'El servidor devolvió un objeto inválido.',
  );
}

function unwrapArray(
  value: unknown,
  keys: string[],
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value)) {
    for (const key of keys) {
      const nested = value[key];
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  throw new Error(
    'El servidor devolvió una lista inválida.',
  );
}

function requiredPositiveInteger(
  value: unknown,
  field: string,
): number {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `El campo ${field} no contiene un identificador válido.`,
    );
  }
  return parsed;
}

function optionalInteger(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function requiredString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(
      `El campo ${field} no contiene texto válido.`,
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(
      `El campo ${field} está vacío.`,
    );
  }
  return normalized;
}

function optionalString(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return typeof value === 'string'
    ? value
    : String(value);
}

function booleanValue(
  value: unknown,
  fallback = true,
): boolean {
  return typeof value === 'boolean'
    ? value
    : fallback;
}

export function normalizeBusiness(
  value: unknown,
): Business {
  const data = unwrapObject(
    value,
    ['business', 'data'],
  );

  return {
    id: requiredPositiveInteger(
      data.id,
      'business.id',
    ),
    owner_id: requiredPositiveInteger(
      data.owner_id,
      'business.owner_id',
    ),
    name: requiredString(
      data.name,
      'business.name',
    ),
    description: optionalString(
      data.description,
    ),
    category: optionalString(
      data.category,
    ),
    address: optionalString(
      data.address,
    ),
    phone: optionalString(
      data.phone,
    ),
    is_active: booleanValue(
      data.is_active,
    ),
    created_at:
      typeof data.created_at === 'string'
        ? data.created_at
        : '',
  };
}

export function normalizeBusinesses(
  value: unknown,
): Business[] {
  return unwrapArray(
    value,
    ['businesses', 'items', 'results', 'data'],
  ).map(normalizeBusiness);
}

export function normalizeResource(
  value: unknown,
): Resource {
  const data = unwrapObject(
    value,
    ['resource', 'data'],
  );

  const capacity = optionalInteger(
    data.capacity,
  );

  return {
    id: requiredPositiveInteger(
      data.id,
      'resource.id',
    ),
    business_id: optionalInteger(
      data.business_id,
    ),
    name: requiredString(
      data.name,
      'resource.name',
    ),
    description: optionalString(
      data.description,
    ),
    category: optionalString(
      data.category,
    ),
    capacity:
      capacity !== null && capacity >= 0
        ? capacity
        : 0,
    price_per_hour:
      data.price_per_hour === null ||
      data.price_per_hour === undefined
        ? 0
        : typeof data.price_per_hour === 'number' ||
            typeof data.price_per_hour === 'string'
          ? data.price_per_hour
          : 0,
    is_active: booleanValue(
      data.is_active,
    ),
  };
}

export function normalizeResources(
  value: unknown,
): Resource[] {
  return unwrapArray(
    value,
    ['resources', 'items', 'results', 'data'],
  ).map(normalizeResource);
}