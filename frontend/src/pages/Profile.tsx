import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import Navbar from '../components/Navbar';

import '../styles/variables.css';
import './Profile.css';

function roleLabel(
  role:
    | 'customer'
    | 'admin'
    | 'superadmin',
): string {
  switch (role) {
    case 'admin':
      return 'Propietario de negocio';

    case 'superadmin':
      return 'Administrador global';

    default:
      return 'Cliente';
  }
}

export default function Profile() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  if (!user) {
    return null;
  }

  const isBusinessOwner =
    user.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pf">
      <Navbar
        active="Perfil"
        userInitials={
          user.initials
        }
      />

      <main className="pf__container">
        <header className="pf__header">
          <div
            className="pf__avatar"
            aria-hidden="true"
          >
            {user.initials}
          </div>

          <div className="pf__identity">
            <span className="pf__eyebrow">
              Cuenta de ReservApp
            </span>

            <h1 className="pf__name">
              {user.name}
            </h1>

            <p className="pf__email">
              {user.email}
            </p>

            <span className="pf__role">
              {roleLabel(user.role)}
            </span>
          </div>
        </header>

        <div className="pf__layout">
          <section className="pf__panel">
            <h2>
              Información de la cuenta
            </h2>

            <dl className="pf__details">
              <div>
                <dt>Nombre</dt>

                <dd>{user.name}</dd>
              </div>

              <div>
                <dt>Correo electrónico</dt>

                <dd>{user.email}</dd>
              </div>

              <div>
                <dt>Tipo de cuenta</dt>

                <dd>
                  {roleLabel(user.role)}
                </dd>
              </div>

              {isBusinessOwner && (
                <div>
                  <dt>Negocio</dt>

                  <dd>
                    {user.businessName ??
                      'Pendiente de configurar'}
                  </dd>
                </div>
              )}
            </dl>

            <div
              className="pf__notice"
              role="note"
            >
              La identidad y los permisos
              provienen del servidor. En esta
              versión, el perfil personal es
              de solo lectura.
            </div>
          </section>

          <aside className="pf__panel">
            <h2>
              Accesos rápidos
            </h2>

            <div className="pf__actions">
              {isBusinessOwner ? (
                <>
                  <button
                    type="button"
                    className="pf__primary"
                    onClick={() =>
                      navigate('/admin')
                    }
                  >
                    Ir al panel
                  </button>

                  <button
                    type="button"
                    className="pf__secondary"
                    onClick={() =>
                      navigate(
                        '/admin/configuracion',
                      )
                    }
                  >
                    Configurar negocio
                  </button>

                  <button
                    type="button"
                    className="pf__secondary"
                    onClick={() =>
                      navigate(
                        '/admin/recursos',
                      )
                    }
                  >
                    Administrar recursos
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="pf__primary"
                    onClick={() =>
                      navigate(
                        '/mis-reservas',
                      )
                    }
                  >
                    Ver mis reservas
                  </button>

                  <button
                    type="button"
                    className="pf__secondary"
                    onClick={() =>
                      navigate('/buscar')
                    }
                  >
                    Buscar servicios
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>

        <section className="pf__scope">
          <h2>
            Funciones disponibles
          </h2>

          <p>
            ReservApp permite administrar
            cuentas, negocios, recursos y
            reservaciones mediante la API
            desplegada.
          </p>

          <p>
            Métodos de pago, direcciones
            personales, favoritos,
            notificaciones y edición del
            perfil requieren endpoints
            adicionales y no se simulan en
            esta versión.
          </p>
        </section>

        <button
          type="button"
          className="pf__logout"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </main>

      <footer className="pf__footer">
        reservapp.com/perfil
      </footer>
    </div>
  );
}
