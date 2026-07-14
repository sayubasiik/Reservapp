import { Link } from "react-router";

export function Header() {
  return (
    <header>
      <nav>
        <Link to="/">Reservapp</Link>

        {" | "}

        <Link to="/login">Iniciar sesión</Link>
      </nav>
    </header>
  );
}