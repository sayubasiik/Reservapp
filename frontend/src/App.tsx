import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import {
  RequireAdmin,
  RequireAuth,
} from './auth/guards';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CompleteBusinessSetup from './pages/CompleteBusinessSetup';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import ServiceDetail from './pages/ServiceDetail';
import BookingCreate from './pages/BookingCreate';
import MyReservations from './pages/MyReservations';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import AdminResources from './pages/AdminResources';
import AdminSettings from './pages/AdminSettings';

function LegacyBookingRedirect() {
  const { id } =
    useParams<{ id: string }>();

  return (
    <Navigate
      to={
        id
          ? `/reservar/${id}`
          : '/buscar'
      }
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/bienvenida"
          element={<Splash />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/registro"
          element={<Register />}
        />

        <Route
          path="/recuperar"
          element={<ForgotPassword />}
        />

        <Route
          path="/completar-negocio"
          element={
            <RequireAdmin>
              <CompleteBusinessSetup />
            </RequireAdmin>
          }
        />

        {/* Aplicación del cliente */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/inicio"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/buscar"
          element={
            <RequireAuth>
              <Search />
            </RequireAuth>
          }
        />

        <Route
          path="/favoritos"
          element={
            <RequireAuth>
              <Navigate
                to="/buscar"
                replace
              />
            </RequireAuth>
          }
        />

        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/servicio/:id"
          element={
            <RequireAuth>
              <ServiceDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id"
          element={
            <RequireAuth>
              <BookingCreate />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id/*"
          element={
            <RequireAuth>
              <LegacyBookingRedirect />
            </RequireAuth>
          }
        />

        <Route
          path="/mis-reservas"
          element={
            <RequireAuth>
              <MyReservations />
            </RequireAuth>
          }
        />

        {/* Panel del propietario */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/reportes"
          element={
            <RequireAdmin>
              <AdminReports />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/recursos"
          element={
            <RequireAdmin>
              <AdminResources />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/configuracion"
          element={
            <RequireAdmin>
              <AdminSettings />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <Navigate
                to="/admin"
                replace
              />
            </RequireAdmin>
          }
        />

        {/* Evita pantallas blancas */}
        <Route
          path="*"
          element={
            <Navigate
              to="/bienvenida"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
