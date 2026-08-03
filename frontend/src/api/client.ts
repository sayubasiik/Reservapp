import axios from 'axios';

import { API_BASE_URL } from './config';
import type {
  ApiErrorBody,
  ValidationErrorItem,
} from './types';

const TOKEN_KEY = 'reservapp_access_token';

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      tokenStore.clear();
      window.dispatchEvent(
        new Event('reservapp:unauthorized'),
      );
    }

    return Promise.reject(error);
  },
);

function validationMessage(
  detail: ValidationErrorItem[],
): string {
  const messages = detail
    .map((item) => item.msg)
    .filter(
      (message): message is string =>
        Boolean(message),
    );

  return messages.length > 0
    ? messages.join(', ')
    : 'Los datos enviados no son válidos.';
}

export function getApiError(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return validationMessage(detail);
  }

  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder.';
  }

  if (!error.response) {
    return 'No fue posible comunicarse con el servidor.';
  }

  return `El servidor respondió con el código ${error.response.status}.`;
}
