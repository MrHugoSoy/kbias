import { BID_LIMITS } from '@/lib/bidLimits';

export const MESSAGE_MAX_LENGTH = 140;

// Validación compartida entre BidForm (formulario principal) y BidButton
// (modal por tarjeta) — antes vivía duplicada en los dos componentes, lo
// que significaba tocar dos archivos cada vez que cambiara un límite.
// Esto NO reemplaza la validación server-side de /api/bid (que sigue
// siendo la única que realmente importa contra fraude); es solo para dar
// feedback inmediato en el formulario.
export function validateBid({
  amountCents,
  anonymous,
  socialUrl,
  message,
}: {
  amountCents: number;
  anonymous: boolean;
  socialUrl: string;
  message?: string;
}): string | null {
  if (!amountCents || amountCents < BID_LIMITS.MIN_CENTS) {
    return `El monto mínimo es $${(BID_LIMITS.MIN_CENTS / 100).toFixed(2)}`;
  }
  if (amountCents > BID_LIMITS.MAX_PER_TX_CENTS) {
    return `El monto máximo por transacción es $${(BID_LIMITS.MAX_PER_TX_CENTS / 100).toLocaleString('es-MX')}`;
  }
  if (!anonymous && socialUrl && !/^https?:\/\/.+/.test(socialUrl)) {
    return 'El link de red social debe empezar con http:// o https://';
  }
  if (message && message.length > MESSAGE_MAX_LENGTH) {
    return `El mensaje no puede pasar de ${MESSAGE_MAX_LENGTH} caracteres`;
  }
  return null;
}
