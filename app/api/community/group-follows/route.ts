import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isRateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_FOLLOWS_PER_WINDOW = 30;
const RATE_WINDOW_MINUTES = 10;

// POST /api/community/group-follows — body: { groupId: string }
//
// Toggle: si el usuario ya sigue a ese grupo, lo deja de seguir; si no, lo
// sigue. Requiere sesión real (verificada por token) — group_follows no
// tiene policy de insert/delete, así que esta es la única forma de
// escribir en ella. La lectura (¿a qué grupos sigo? ¿cuántos seguidores
// tiene este grupo?) es pública y se hace directo desde el cliente.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { groupId } = await req.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
    }

    const { data: group } = await supabase.from('groups').select('id').eq('id', groupId).maybeSingle();
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from('group_follows')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('group_follows').delete().eq('id', existing.id);
      if (error) return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    } else {
      if (await isRateLimited(supabase, 'group_follows', 'user_id', userId, MAX_FOLLOWS_PER_WINDOW, RATE_WINDOW_MINUTES)) {
        return NextResponse.json({ error: 'Vas muy rápido. Espera unos minutos.' }, { status: 429 });
      }
      const { error } = await supabase.from('group_follows').insert({ user_id: userId, group_id: groupId });
      // 23505 = ya existía (doble clic/dos pestañas ganándole la carrera al chequeo de arriba) — no es un error real.
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from('group_follows')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    return NextResponse.json({ following: !existing, followerCount: count ?? 0 });
  } catch (err) {
    console.error('Error en /api/community/group-follows:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
