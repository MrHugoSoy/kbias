import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/group-battles — todas las batallas de grupo vigentes (en curso,
// próximas y finalizadas recientes) para /batallas. ensure_active_group_battles
// arma una tanda nueva si no queda ninguna en curso ni programada; si ya hay,
// no hace nada, así que llamarla siempre es barato.
//
// Mismo cliente sin caché que /api/song-battles: el fetch interno de
// supabase-js se cachea incluso con `dynamic = 'force-dynamic'`.
function getUncachedPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export async function GET() {
  const supabase = getUncachedPublicClient();

  const { error: ensureError } = await supabase.rpc('ensure_active_group_battles');
  if (ensureError) {
    console.error('Error en ensure_active_group_battles:', ensureError);
  }

  const { data, error } = await supabase.from('group_battle_feed').select('*').limit(40);
  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ battles: data ?? [] });
}
