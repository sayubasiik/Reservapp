import './BookingSteps.css';

const DEFAULT_STEPS = ['Servicio', 'Fecha', 'Horario', 'Confirmar', 'Pago'];

interface BookingStepsProps {
  /** Paso activo (1 = primero) */
  current: number;
  /** Etiquetas del flujo; las reservas por día usan un paso menos */
  steps?: string[];
}

export default function BookingSteps({ current, steps = DEFAULT_STEPS }: BookingStepsProps) {
  return (
    <div className="bs">
      {/* Barra de progreso */}
      <div className="bs__track">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`bs__segment ${i + 1 <= current ? 'is-filled' : ''}`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="bs__labels">
        {steps.map((label, i) => (
          <span
            key={label}
            className={`bs__label ${i + 1 === current ? 'is-active' : ''}`}
          >
            {i + 1} {label}
          </span>
        ))}
      </div>
    </div>
  );
}
