export type UiRole =
  | 'customer'
  | 'admin'
  | 'superadmin';

export type ApiRole =
  | 'client'
  | 'business_owner'
  | 'admin';

const API_TO_UI: Record<ApiRole, UiRole> = {
  client: 'customer',
  business_owner: 'admin',
  admin: 'superadmin',
};

const UI_TO_API: Record<
  'customer' | 'admin',
  'client' | 'business_owner'
> = {
  customer: 'client',
  admin: 'business_owner',
};

export function toUiRole(role: ApiRole): UiRole {
  return API_TO_UI[role];
}

export function toApiRole(
  role: 'customer' | 'admin',
): 'client' | 'business_owner' {
  return UI_TO_API[role];
}
