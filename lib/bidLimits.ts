// Límites anti-fraude / anti-gasto-descontrolado.
// Ajusta estos valores según tu apetito de riesgo, pero NO los quites:
// esto es lo que evita chargebacks masivos y quejas de menores
// gastando de más con la tarjeta de sus papás.
//
// El monto mínimo/máximo por transacción ya no aplica: el precio lo fija
// el paquete elegido (ver lib/pointPackages.ts), no un monto libre. Lo
// único que sigue viviendo aquí es el tope diario acumulado por IP.
//
// Vive en su propio archivo (sin importar el SDK de Stripe) porque
// también lo usan componentes de cliente (BidButton) — si
// importaran lib/stripe.ts, arrastrarían `new Stripe(...)` al bundle del
// navegador, donde STRIPE_SECRET_KEY no existe y el SDK truena al cargar.
export const BID_LIMITS = {
  DAILY_CAP_CENTS: 1000000, // $10,000.00 tope acumulado por IP en 24h (frena gasto compulsivo)
};
