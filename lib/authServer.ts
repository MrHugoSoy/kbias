import type { SupabaseClient } from '@supabase/supabase-js';

function getBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Verifica el token de acceso de Supabase contra Supabase Auth y devuelve el
// id de usuario real. Nunca confíes en un userId que mande el cliente.
export async function getVerifiedUserId(req: Request, admin: SupabaseClient): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
