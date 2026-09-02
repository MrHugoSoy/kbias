// Inicio del día calendario UTC en curso — el mismo límite que usa el
// presupuesto de 5 puntos diarios (cast_vote en supabase/schema.sql), así
// que cualquier chequeo de "¿hizo X hoy?" en el servidor o en el cliente
// usa exactamente la misma frontera.
export function utcDayStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
