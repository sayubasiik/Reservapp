import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router";

import { Header } from "../components/layout/Header";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/LoginPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />

      <main>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/" element={<HomePage />} 
          />

          <Route 
            path="*" element={<NotFoundPage />} 
          />
          
        </Routes>
      </main>
    </BrowserRouter>
  );
}