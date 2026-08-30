import { getPointPackage } from '@/lib/pointPackages';

export const MESSAGE_MAX_LENGTH = 140;

// Validación compartida entre BidForm (formulario principal) y BidButton
// (modal por tarjeta) — antes vivía duplicada en los dos componentes, lo
// que significaba tocar dos archivos cada vez que cambiara un límite.
// Esto NO reemplaza la validación server-side de /api/bid (que sigue
// siendo la única que realmente importa contra fraude); es solo para dar
// feedback inmediato en el formulario.
export function validateBid({
  packageId,
  anonymous,
  socialUrl,
  message,
}: {
  packageId: string;
  anonymous: boolean;
  socialUrl: string;
  message?: string;
}): string | null {
  if (!packageId || !getPointPackage(packageId)) {
    return 'Elige un paquete de puntos';
  }
  if (!anonymous && socialUrl && !/^https?:\/\/.+/.test(socialUrl)) {
    return 'El link de red social debe empezar con http:// o https://';
  }
  if (message && message.length > MESSAGE_MAX_LENGTH) {
    return `El mensaje no puede pasar de ${MESSAGE_MAX_LENGTH} caracteres`;
  }
  return null;
}
