import {
  Navigate,
  useLocation,
} from 'react-router-dom';
import type {
  ReactNode,
} from 'react';

import {
  useAuth,
} from './AuthContext';

function SessionLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily:
          'system-ui, sans-serif',
      }}
    >
      Verificando sesión…
    </div>
  );
}

export function RequireAuth({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    isInitializing,
  } = useAuth();

  if (isInitializing) {
    return <SessionLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/bienvenida"
        replace
      />
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    isInitializing,
  } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return <SessionLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/bienvenida"
        replace
      />
    );
  }

  if (
    user.role !== 'admin' &&
    user.role !== 'superadmin'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const isSetupRoute =
    location.pathname ===
    '/completar-negocio';

  if (
    user.role === 'admin' &&
    user.needsBusinessSetup &&
    !isSetupRoute
  ) {
    return (
      <Navigate
        to="/completar-negocio"
        replace
      />
    );
  }

  if (
    isSetupRoute &&
    (
      user.role === 'superadmin' ||
      !user.needsBusinessSetup
    )
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return <>{children}</>;
}
