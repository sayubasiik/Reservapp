import { apiClient } from "./client";

export type UserRole =
  | "customer"
  | "business_owner";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  role?: UserRole;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    role?: UserRole;
  };
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response =
    await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );

  return response.data;
}