export type ApiRole =
  | 'client'
  | 'business_owner'
  | 'admin';

export interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  role: ApiRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  role?: 'client' | 'business_owner';
}

export interface Business {
  id: number;
  owner_id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusinessCreate {
  name: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  owner_id?: number;
}

export interface BusinessUpdate {
  name?: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export interface Resource {
  id: number;
  business_id: number | null;
  name: string;
  description?: string | null;
  category?: string | null;
  capacity?: number | null;
  price_per_hour?: number | string | null;
  is_active: boolean;
}

export interface ResourceCreate {
  name: string;
  business_id: number;
  description?: string | null;
  category?: string | null;
  capacity?: number;
  price_per_hour?: number;
}

export interface ResourceUpdate {
  name?: string;
  business_id?: number;
  description?: string | null;
  category?: string | null;
  capacity?: number;
  price_per_hour?: number;
  is_active?: boolean;
}

export interface AvailabilityResponse {
  resource_id: number;
  start: string;
  end: string;
  available: boolean;
}

export interface ReservationCreate {
  resource_id: number;
  start_time: string;
  end_time: string;
  notes?: string | null;
}

export interface Reservation {
  id: number;
  user_id: number;
  resource_id: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  resource?: Resource | null;
}

export interface ValidationErrorItem {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

export interface ApiErrorBody {
  detail?: string | ValidationErrorItem[];
}
