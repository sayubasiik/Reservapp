import {
  Component,
} from 'react';
import type {
  ErrorInfo,
  ReactNode,
} from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(
    error: Error,
  ): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ): void {
    console.error(
      '[RESERVAPP_FATAL_UI]',
      error,
      info,
    );
  }

  private retry = (): void => {
    window.location.reload();
  };

  private goHome = (): void => {
    window.location.assign('/inicio');
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '32px',
          background: '#f4f6fb',
          fontFamily: 'system-ui, sans-serif',
          color: '#172554',
        }}
      >
        <section
          style={{
            width: 'min(680px, 100%)',
            padding: '28px',
            borderRadius: '18px',
            background: '#ffffff',
            boxShadow:
              '0 18px 50px rgba(15, 23, 42, 0.12)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#1d4ed8',
            }}
          >
            ReservApp
          </p>
          <h1>
            No fue posible mostrar esta pÃ¡gina
          </h1>
          <p>
            La sesiÃ³n y tus datos siguen guardados. La
            interfaz encontrÃ³ una respuesta que no pudo
            representar correctamente.
          </p>
          <details>
            <summary>Detalle tÃ©cnico</summary>
            <pre
              style={{
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                padding: '14px',
                borderRadius: '10px',
                background: '#eff6ff',
              }}
            >
              {this.state.error.message}
            </pre>
          </details>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '22px',
            }}
          >
            <button
              type="button"
              onClick={this.retry}
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
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.goHome}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '11px 18px',
                background: '#ffffff',
                color: '#1e3a8a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Volver al inicio
            </button>
          </div>
        </section>
      </main>
    );
  }
}