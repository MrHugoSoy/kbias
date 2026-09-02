import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/song-battles — batallas de canciones activas ahora mismo.
// ensure_active_song_battles() arma una ronda nueva si no queda ninguna
// vigente; si ya hay batallas activas, no hace nada (llamarla siempre es
// barato).
//
// getSupabasePublicClient() no basta aquí: Next.js cachea el fetch interno
// de supabase-js incluso con `dynamic = 'force-dynamic'` en esta ruta (se
// vio en pruebas: los puntos de una votación recién hecha no aparecían ni
// esperando ni tras reiniciar el request, solo tras reiniciar el server) —
// así que este cliente fuerza `cache: 'no-store'` explícitamente.
function getUncachedPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export async function GET() {
  const supabase = getUncachedPublicClient();

  const { error: ensureError } = await supabase.rpc('ensure_active_song_battles');
  if (ensureError) {
    console.error('Error en ensure_active_song_battles:', ensureError);
  }

  const { data, error } = await supabase.from('song_battle_feed').select('*').limit(6);
  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ battles: data ?? [] });
}
