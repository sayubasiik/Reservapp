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
import {
  createBusiness,
  findOwnedBusiness,
} from '../api/businesses';
import { getApiError } from '../api/client';
import {
  toApiRole,
  toUiRole,
} from '../api/roles';
import type { UiRole } from '../api/roles';
import type {
  ApiUser,
  Business,
} from '../api/types';
import {
  businessInitials,
  slugify,
} from '../data/businesses';
import type {
  BusinessType,
} from '../data/businesses';
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

export interface BusinessSetupData {
  name: string;
  category: BusinessType;
  phone?: string;
  address?: string;
  description?: string;
}

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

  // Identificador local para los modulos mock existentes.
  businessId?: string;

  // Identificador numerico real devuelto por PostgreSQL.
  apiBusinessId?: number;

  businessName?: string;
  businessType?: BusinessType;
  businessAddress?: string;
  businessDescription?: string;
  needsBusinessSetup?: boolean;
  businessLookupFailed?: boolean;
}

export interface RegisterData {
  role: RegisterRole;
  name: string;
  email: string;
  password: string;
  phone?: string;
  business?: BusinessSetupData;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
  requiresBusinessSetup?: boolean;
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
  completeBusinessSetup: (
    data: BusinessSetupData,
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

const BUSINESS_TYPES: BusinessType[] = [
  'alimentos',
  'ejercicio',
  'belleza',
  'medico',
  'hospedaje',
  'eventos',
];

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

function profileKey(
  userId: string,
): string {
  return `${PROFILE_PREFIX}${userId}`;
}

function readUiProfile(
  userId: string,
): Partial<AuthUser> {
  try {
    const raw = localStorage.getItem(
      profileKey(userId),
    );

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as
      Partial<AuthUser>;

    // Solo recuperamos preferencias visuales/locales.
    // Los permisos, el negocio y sus identificadores
    // siempre se vuelven a resolver desde la API.
    return {
      name: parsed.name,
      initials: parsed.initials,
      phone: parsed.phone,
      avatar: parsed.avatar,
      addresses: parsed.addresses,
      cards: parsed.cards,
      notifications: parsed.notifications,
    };
  } catch {
    return {};
  }
}

function saveUiProfile(
  user: AuthUser,
): void {
  const profile: Partial<AuthUser> = {
    name: user.name,
    initials: user.initials,
    phone: user.phone,
    avatar: user.avatar,
    addresses: user.addresses,
    cards: user.cards,
    notifications: user.notifications,
  };

  localStorage.setItem(
    profileKey(user.id),
    JSON.stringify(profile),
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

function asBusinessType(
  value?: string | null,
): BusinessType | undefined {
  return BUSINESS_TYPES.find(
    (type) => type === value,
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
      `owner-${apiUser.id}`;

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

function applyBusiness(
  user: AuthUser,
  business: Business,
): AuthUser {
  return {
    ...user,
    apiBusinessId: business.id,
    businessId: slugify(business.name),
    businessName: business.name,
    businessType:
      asBusinessType(business.category) ??
      user.businessType,
    phone: business.phone ?? user.phone,
    businessAddress:
      business.address ?? undefined,
    businessDescription:
      business.description ?? undefined,
    needsBusinessSetup: false,
    businessLookupFailed: false,
  };
}

async function resolveOwnedBusiness(
  apiUser: ApiUser,
  user: AuthUser,
): Promise<AuthUser> {
  if (
    apiUser.role !== 'business_owner'
  ) {
    return user;
  }

  try {
    const business =
      await findOwnedBusiness(apiUser.id);

    if (!business) {
      return {
        ...user,
        apiBusinessId: undefined,
        businessName: undefined,
        businessAddress: undefined,
        businessDescription: undefined,
        needsBusinessSetup: true,
        businessLookupFailed: false,
      };
    }

    return applyBusiness(
      user,
      business,
    );
  } catch {
    // No reutilizamos datos operativos guardados en el
    // navegador cuando falla la consulta del negocio.
    return {
      ...user,
      apiBusinessId: undefined,
      businessName: undefined,
      businessAddress: undefined,
      businessDescription: undefined,
      needsBusinessSetup: false,
      businessLookupFailed: true,
    };
  }
}

async function getOrCreateBusiness(
  ownerId: number,
  data: BusinessSetupData,
): Promise<Business> {
  const existing =
    await findOwnedBusiness(ownerId);

  if (existing) {
    return existing;
  }

  return createBusiness({
    name: data.name.trim(),
    category: data.category,
    phone: data.phone?.trim() || null,
    address:
      data.address?.trim() || null,
    description:
      data.description?.trim() || null,
  });
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

        const mapped =
          mapApiUser(apiUser);

        const restored =
          await resolveOwnedBusiness(
            apiUser,
            mapped,
          );

        if (active) {
          setUser(restored);
          saveUiProfile(restored);
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
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(
      'reservapp:unauthorized',
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        'reservapp:unauthorized',
        handleUnauthorized,
      );
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

      const mapped =
        mapApiUser(apiUser);

      const authenticated =
        await resolveOwnedBusiness(
          apiUser,
          mapped,
        );

      setUser(authenticated);
      saveUiProfile(authenticated);

      return {
        ok: true,
        user: authenticated,
        requiresBusinessSetup:
          authenticated.needsBusinessSetup,
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
    let accountCreated = false;

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

      accountCreated = true;

      const apiUser = await loginUser(
        data.email,
        data.password,
      );

      let authenticated =
        mapApiUser(
          apiUser,
          {
            phone:
              data.phone?.trim(),
          },
        );

      if (data.role === 'admin') {
        if (!data.business) {
          throw new Error(
            'Faltan los datos del negocio.',
          );
        }

        try {
          const business =
            await getOrCreateBusiness(
              apiUser.id,
              data.business,
            );

          authenticated =
            applyBusiness(
              authenticated,
              business,
            );
        } catch (error) {
          const pending: AuthUser = {
            ...authenticated,
            businessId:
              slugify(
                data.business.name,
              ),
            businessName:
              data.business.name.trim(),
            businessType:
              data.business.category,
            businessAddress:
              data.business.address?.trim(),
            businessDescription:
              data.business.description?.trim(),
            phone:
              data.business.phone?.trim() ||
              authenticated.phone,
            apiBusinessId: undefined,
            needsBusinessSetup: true,
            businessLookupFailed: false,
          };

          setUser(pending);
          saveUiProfile(pending);

          return {
            ok: false,
            user: pending,
            requiresBusinessSetup: true,
            error:
              'La cuenta se creó correctamente, ' +
              'pero el negocio no pudo registrarse. ' +
              'Puedes reintentar sin crear otra cuenta. ' +
              getApiError(error),
          };
        }
      }

      setUser(authenticated);
      saveUiProfile(authenticated);

      return {
        ok: true,
        user: authenticated,
      };
    } catch (error) {
      return {
        ok: false,
        error: accountCreated
          ? 'La cuenta se creó, pero no fue posible ' +
            'completar el inicio de sesión. ' +
            getApiError(error)
          : getApiError(error),
      };
    }
  };

  const completeBusinessSetup = async (
    data: BusinessSetupData,
  ): Promise<AuthResult> => {
    if (!user || user.role !== 'admin') {
      return {
        ok: false,
        error:
          'Necesitas iniciar sesión como propietario.',
      };
    }

    try {
      const business =
        await getOrCreateBusiness(
          Number(user.id),
          data,
        );

      const completed =
        applyBusiness(
          user,
          business,
        );

      setUser(completed);
      saveUiProfile(completed);

      return {
        ok: true,
        user: completed,
      };
    } catch (error) {
      return {
        ok: false,
        user,
        requiresBusinessSetup: true,
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
        // la identidad, el rol ni el id
        // real del negocio localmente.
        id: current.id,
        role: current.role,
        apiBusinessId:
          current.apiBusinessId,
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
        completeBusinessSetup,
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
