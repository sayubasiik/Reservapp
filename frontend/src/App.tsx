import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { RequireAdmin, RequireAuth } from './auth/guards';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CompleteBusinessSetup from './pages/CompleteBusinessSetup';

import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import ServiceDetail from './pages/ServiceDetail';

import DateSelect from './pages/DateSelect';
import TimeSelect from './pages/TimeSelect';
import BookingConfirm from './pages/BookingConfirm';
import Payment from './pages/Payment';
import BookingSuccess from './pages/BookingSuccess';
import MyReservations from './pages/MyReservations';

import AdminDashboard from './pages/AdminDashboard';
import AdminCalendar from './pages/AdminCalendar';
import AdminReports from './pages/AdminReports';
import AdminClients from './pages/AdminClients';
import AdminGallery from './pages/AdminGallery';
import AdminMessages from './pages/AdminMessages';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/bienvenida" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar" element={<ForgotPassword />} />

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

        {/* Alias legible para la página de inicio */}
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
              <Favorites />
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
          path="/reservar/:id/fecha"
          element={
            <RequireAuth>
              <DateSelect />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id/horario"
          element={
            <RequireAuth>
              <TimeSelect />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id/confirmar"
          element={
            <RequireAuth>
              <BookingConfirm />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id/pago"
          element={
            <RequireAuth>
              <Payment />
            </RequireAuth>
          }
        />

        <Route
          path="/reservar/:id/exito"
          element={
            <RequireAuth>
              <BookingSuccess />
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

        {/* Panel administrativo */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/calendario"
          element={
            <RequireAdmin>
              <AdminCalendar />
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
          path="/admin/clientes"
          element={
            <RequireAdmin>
              <AdminClients />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/galeria"
          element={
            <RequireAdmin>
              <AdminGallery />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/mensajes"
          element={
            <RequireAdmin>
              <AdminMessages />
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

        {/* Evita pantallas blancas cuando la ruta no existe */}
        <Route
          path="*"
          element={<Navigate to="/bienvenida" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}