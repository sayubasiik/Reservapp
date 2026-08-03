import {
  useNavigate,
} from 'react-router-dom';

import '../styles/variables.css';
import './Splash.css';

export default function Splash() {
  const navigate =
    useNavigate();

  return (
    <div className="sp">
      <span className="sp__blob sp__blob--tr" />
      <span className="sp__blob sp__blob--bl" />

      <div className="sp__content">
        <div className="sp__logo">
          RV
        </div>

        <h1 className="sp__brand">
          ReservApp
        </h1>

        <p className="sp__tagline">
          Reserva fácil y rápido
        </p>

        <button
          type="button"
          className="sp__cta"
          onClick={() =>
            navigate('/login')
          }
        >
          Comenzar
        </button>
      </div>

      <footer className="sp__footer">
        reservapp.com
      </footer>
    </div>
  );
}
