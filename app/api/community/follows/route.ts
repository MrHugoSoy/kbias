import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isRateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_FOLLOWS_PER_WINDOW = 30;
const RATE_WINDOW_MINUTES = 10;

// POST /api/community/follows — body: { userId: string }
//
// Toggle: si el usuario ya sigue a userId, lo deja de seguir; si no, lo
// sigue. Requiere sesión real (verificada por token) — user_follows no
// tiene policy de insert/delete, así que esta es la única forma de
// escribir en ella. La lectura (¿a quién sigo?) es pública y se hace
// directo desde el cliente, sin pasar por aquí.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const followerId = await getVerifiedUserId(req, supabase);
    if (!followerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId: followeeId } = await req.json();
    if (!followeeId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }
    if (followeeId === followerId) {
      return NextResponse.json({ error: 'No puedes seguirte a ti mismo' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('user_follows').delete().eq('id', existing.id);
      if (error) return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    } else {
      if (
        await isRateLimited(supabase, 'user_follows', 'follower_id', followerId, MAX_FOLLOWS_PER_WINDOW, RATE_WINDOW_MINUTES)
      ) {
        return NextResponse.json({ error: 'Vas muy rápido. Espera unos minutos.' }, { status: 429 });
      }
      const { error } = await supabase.from('user_follows').insert({ follower_id: followerId, followee_id: followeeId });
      // 23505 = ya existía (doble clic/dos pestañas ganándole la carrera al chequeo de arriba) — no es un error real.
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('followee_id', followeeId);

    return NextResponse.json({ following: !existing, followerCount: count ?? 0 });
  } catch (err) {
    console.error('Error en /api/community/follows:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
