import { createClient } from '@supabase/supabase-js';

// Cliente de navegador (una sola instancia, guarda la sesión en localStorage) —
// úsalo en Client Components para signUp/signInWithPassword/getSession/voto.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cliente público (solo lectura, respeta RLS) — úsalo en Server Components
export function getSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cliente con service role — SOLO en API routes del servidor.
// Es el único cliente autorizado a insertar filas en `votes` (después de
// verificar el token real de sesión, ver lib/authServer.ts) y, si se
// reactiva el cobro, en `bids`.
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
