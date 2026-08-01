import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  getCurrentUser,
  hasStoredToken,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/auth';
import { getApiError } from '../api/client';
import { toApiRole, toUiRole } from '../api/roles';
import type { UiRole } from '../api/roles';
import type { ApiUser } from '../api/types';
import {
  businessInitials,
  slugify,
} from '../data/businesses';
import type { BusinessType } from '../data/businesses';
import { demoAccounts } from '../data/demoAccounts';

export type Role = UiRole;
export type RegisterRole =
  Exclude<Role, 'superadmin'>;

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
}

export interface NotificationPrefs {
  reservations: boolean;
  reminders: boolean;
  promotions: boolean;
  email: boolean;
}

export const DEFAULT_NOTIFICATIONS:
NotificationPrefs = {
  reservations: true,
  reminders: true,
  promotions: false,
  email: true,
};

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses?: SavedAddress[];
  cards?: SavedCard[];
  notifications?: NotificationPrefs;
  businessId?: string;
  businessType?: BusinessType;
}

export interface RegisterData {
  role: RegisterRole;
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessType?: BusinessType;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  register: (
    data: RegisterData,
  ) => Promise<AuthResult>;
  updateUser: (
    patch: Partial<AuthUser>,
  ) => void;
  logout: () => void;
}

const PROFILE_PREFIX =
  'reservapp_ui_profile_';

const LEGACY_USER_KEY =
  'reservvap_user';

const LEGACY_ACCOUNTS_KEY =
  'reservvap_accounts';

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

function profileKey(userId: string): string {
  return `${PROFILE_PREFIX}${userId}`;
}

function readUiProfile(
  userId: string,
): Partial<AuthUser> {
  try {
    const raw = localStorage.getItem(
      profileKey(userId),
    );

    return raw
      ? (JSON.parse(raw) as Partial<AuthUser>)
      : {};
  } catch {
    return {};
  }
}

function saveUiProfile(
  user: AuthUser,
): void {
  localStorage.setItem(
    profileKey(user.id),
    JSON.stringify(user),
  );
}

function clearLegacyAuth(): void {
  localStorage.removeItem(
    LEGACY_USER_KEY,
  );

  localStorage.removeItem(
    LEGACY_ACCOUNTS_KEY,
  );
}

function mapApiUser(
  apiUser: ApiUser,
  overrides: Partial<AuthUser> = {},
): AuthUser {
  const id = String(apiUser.id);
  const role = toUiRole(apiUser.role);
  const cached = readUiProfile(id);

  const demo = demoAccounts.find(
    (account) =>
      account.email.toLowerCase() ===
      apiUser.email.toLowerCase(),
  );

  const base: AuthUser = {
    id,
    role,
    name: apiUser.full_name,
    initials: businessInitials(
      apiUser.full_name,
    ),
    email: apiUser.email,
    phone: demo?.phone,
  };

  if (role === 'customer') {
    const isMainDemo =
      apiUser.email.toLowerCase() ===
      'olaf.andrade@correo.com';

    base.addresses = isMainDemo
      ? [
          {
            id: 'a1',
            label: 'Casa',
            address:
              'Av. Universidad 123, Col. Centro, CDMX',
          },
        ]
      : [];

    base.cards = isMainDemo
      ? [
          {
            id: 'c1',
            brand: 'Visa',
            last4: '4242',
            holder: apiUser.full_name,
            expiry: '08/28',
          },
        ]
      : [];

    base.notifications = {
      ...DEFAULT_NOTIFICATIONS,
    };
  }

  if (role === 'admin') {
    base.businessId =
      demo?.businessId ??
      slugify(apiUser.full_name);

    base.businessType =
      demo?.businessType;
  }

  const merged: AuthUser = {
    ...base,
    ...cached,
    ...overrides,

    // La identidad y el rol siempre
    // provienen del backend.
    id,
    role,
    email: apiUser.email,
  };

  if (!merged.initials) {
    merged.initials = businessInitials(
      merged.name,
    );
  }

  return merged;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      clearLegacyAuth();

      if (!hasStoredToken()) {
        if (active) {
          setIsInitializing(false);
        }

        return;
      }

      try {
        const apiUser =
          await getCurrentUser();

        const restored =
          mapApiUser(apiUser);

        if (active) {
          setUser(restored);
        }
      } catch {
        logoutUser();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    try {
      clearLegacyAuth();

      const apiUser = await loginUser(
        email,
        password,
      );

      const authenticated =
        mapApiUser(apiUser);

      setUser(authenticated);
      saveUiProfile(authenticated);

      return {
        ok: true,
        user: authenticated,
      };
    } catch (error) {
      return {
        ok: false,
        error: getApiError(error),
      };
    }
  };

  const register = async (
    data: RegisterData,
  ): Promise<AuthResult> => {
    try {
      clearLegacyAuth();

      await registerUser({
        full_name: data.name.trim(),
        email:
          data.email
            .trim()
            .toLowerCase(),
        password: data.password,
        role: toApiRole(data.role),
      });

      const apiUser = await loginUser(
        data.email,
        data.password,
      );

      const authenticated =
        mapApiUser(
          apiUser,
          {
            phone:
              data.phone?.trim(),

            businessId:
              data.role === 'admin'
                ? slugify(data.name)
                : undefined,

            businessType:
              data.role === 'admin'
                ? data.businessType
                : undefined,
          },
        );

      setUser(authenticated);
      saveUiProfile(authenticated);

      return {
        ok: true,
        user: authenticated,
      };
    } catch (error) {
      return {
        ok: false,
        error: getApiError(error),
      };
    }
  };

  const updateUser = (
    patch: Partial<AuthUser>,
  ) => {
    setUser((current) => {
      if (!current) {
        return current;
      }

      const next: AuthUser = {
        ...current,
        ...patch,

        // No permitimos modificar
        // la identidad ni el rol
        // mediante preferencias locales.
        id: current.id,
        role: current.role,
      };

      saveUiProfile(next);

      return next;
    });
  };

  const logout = () => {
    logoutUser();
    clearLegacyAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitializing,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe usarse dentro de <AuthProvider>',
    );
  }

  return context;
}
