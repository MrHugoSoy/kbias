import { createClient } from '@supabase/supabase-js';

// Cliente público (solo lectura, respeta RLS) — úsalo en Server Components
export function getSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cliente con service role — SOLO en API routes del servidor.
// Este es el único cliente autorizado a insertar filas en `bids`,
// porque el monto se valida server-side contra Stripe antes de escribir.
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
