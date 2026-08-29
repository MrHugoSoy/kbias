// Dominio real de producción — respaldo por si NEXT_PUBLIC_SITE_URL queda
// mal configurado en Vercel (ya pasó una vez). En local sigue detectando
// localhost automáticamente vía NODE_ENV. Cuando el dominio cambie o se
// confirme uno nuevo, solo hay que tocar este archivo.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://kpopwars.com');
