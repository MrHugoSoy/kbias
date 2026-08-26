import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Límites anti-fraude / anti-gasto-descontrolado.
// Ajusta estos valores según tu apetito de riesgo, pero NO los quites:
// esto es lo que evita chargebacks masivos y quejas de menores
// gastando de más con la tarjeta de sus papás.
export const BID_LIMITS = {
  MIN_CENTS: 100,           // $1.00 mínimo por puja
  MAX_PER_TX_CENTS: 500000, // $5,000.00 máximo por transacción individual
  DAILY_CAP_CENTS: 1000000, // $10,000.00 tope acumulado por IP en 24h (frena gasto compulsivo)
};
