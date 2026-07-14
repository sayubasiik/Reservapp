import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router";

import { Header } from "../components/layout/Header";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={<h1>Inicio de sesión</h1>}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}