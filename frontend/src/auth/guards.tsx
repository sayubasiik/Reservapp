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
function BusinessResolutionError() {
  return (
    <main
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '28px',
        background: '#f4f6fb',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section
        style={{
          width: 'min(620px, 100%)',
          padding: '26px',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow:
            '0 16px 45px rgba(15, 23, 42, .12)',
        }}
      >
        <h1>No pudimos recuperar tu negocio</h1>
        <p>
          Tu cuenta sigue activa, pero el panel necesita
          volver a consultar el negocio asociado antes de
          mostrar recursos, configuración y reportes.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            border: 0,
            borderRadius: '10px',
            padding: '11px 18px',
            background: '#1e40af',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reintentar consulta
        </button>
      </section>
    </main>
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


  if (
    user.role === 'admin' &&
    (
      user.businessLookupFailed ||
      (
        !user.needsBusinessSetup &&
        !user.apiBusinessId
      )
    )
  ) {
    return <BusinessResolutionError />;
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
