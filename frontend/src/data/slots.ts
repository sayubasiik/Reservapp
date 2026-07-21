// Horarios disponibles del día (compartidos entre la selección de horario,
// la configuración del negocio y el cálculo de disponibilidad).
export const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

// Cupos por defecto para cada horario (el admin puede cambiarlos).
// 1 = un solo espacio; al reservarlo el horario queda ocupado.
export const DEFAULT_CAPACITY: Record<string, number> = {
  '9:00 AM': 1,
  '10:00 AM': 3,
  '11:00 AM': 2,
  '12:00 PM': 1,
  '1:00 PM': 2,
  '2:00 PM': 4,
  '3:00 PM': 2,
  '4:00 PM': 1,
  '5:00 PM': 2,
  '6:00 PM': 1,
  '7:00 PM': 3,
  '8:00 PM': 2,
};
