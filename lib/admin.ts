// Lista de correos con acceso a /admin/* — vive en una variable de entorno
// (server-only, nunca NEXT_PUBLIC) para no hornear el correo del admin en
// el bundle del cliente ni en el código fuente.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
