import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import { AuthProvider } from './auth/AuthContext';
import { StoreProvider } from './store/StoreContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
