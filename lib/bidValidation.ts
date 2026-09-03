import { getPointPackage } from '@/lib/pointPackages';

export const MESSAGE_MAX_LENGTH = 140;

// Validación usada por BidButton (modal por tarjeta) para dar feedback
// inmediato. Esto NO reemplaza la validación server-side de /api/bid (que
// sigue siendo la única que realmente importa contra fraude).
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
