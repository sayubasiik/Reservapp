import { apiClient, tokenStore } from './client';
import type {
  ApiUser,
  RegisterInput,
  TokenResponse,
} from './types';

export async function registerUser(
  input: RegisterInput,
): Promise<ApiUser> {
  const response = await apiClient.post<ApiUser>(
    '/auth/register',
    input,
  );

  return response.data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<ApiUser> {
  const body = new URLSearchParams();

  body.set('username', email.trim().toLowerCase());
  body.set('password', password);

  const response =
    await apiClient.post<TokenResponse>(
      '/auth/login',
      body,
      {
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
      },
    );

  tokenStore.set(response.data.access_token);

  try {
    return await getCurrentUser();
  } catch (error) {
    tokenStore.clear();
    throw error;
  }
}

export async function getCurrentUser(): Promise<ApiUser> {
  const response =
    await apiClient.get<ApiUser>('/users/me');

  return response.data;
}

export function logoutUser(): void {
  tokenStore.clear();
}

export function hasStoredToken(): boolean {
  return Boolean(tokenStore.get());
}
