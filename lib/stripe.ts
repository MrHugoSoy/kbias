import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Los límites de monto viven en lib/bidLimits.ts (re-exportados aquí por
// compatibilidad con imports existentes) — ese archivo no importa el SDK
// de Stripe, así que también lo pueden usar componentes de cliente.
export { BID_LIMITS } from '@/lib/bidLimits';
