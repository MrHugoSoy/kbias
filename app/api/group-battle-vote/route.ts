import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';
import { utcDayStart } from '@/lib/dailyWindow';

export const dynamic = 'force-dynamic';

const DAILY_POINT_BUDGET = 5;

// POST /api/group-battle-vote — body: { battleId, groupId, points, message? }
//
// Igual que /api/song-vote pero para una batalla de grupos completos —
// mismo presupuesto de 5 puntos diarios (compartido entre votos de grupo,
// de canción y de batalla de grupo); cast_group_battle_vote() en la base
// de datos es la defensa real contra condiciones de carrera, esta consulta
// solo da un mensaje de error más claro antes de intentarlo.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { battleId, groupId, points, message } = await req.json();
    if (!battleId || !groupId) {
      return NextResponse.json({ error: 'Falta battleId o groupId' }, { status: 400 });
    }
    const pointsToGive = Number(points);
    if (!Number.isInteger(pointsToGive) || pointsToGive < 1 || pointsToGive > DAILY_POINT_BUDGET) {
      return NextResponse.json({ error: 'Elige entre 1 y 5 puntos' }, { status: 400 });
    }

    if (message) {
      if (message.length > MESSAGE_MAX_LENGTH) {
        return NextResponse.json({ error: `El mensaje no puede pasar de ${MESSAGE_MAX_LENGTH} caracteres` }, { status: 400 });
      }
      if (isOffensive(message)) {
        return NextResponse.json({ error: 'Ese mensaje no está permitido. Intenta con otro.' }, { status: 400 });
      }
    }

    const { data: battle } = await supabase
      .from('group_battles')
      .select('id, group_a_id, group_b_id, starts_at, ends_at')
      .eq('id', battleId)
      .maybeSingle();
    if (!battle) {
      return NextResponse.json({ error: 'Batalla no encontrada' }, { status: 404 });
    }
    if (new Date(battle.starts_at).getTime() > Date.now()) {
      return NextResponse.json({ error: 'Esta batalla todavía no empieza' }, { status: 409 });
    }
    if (new Date(battle.ends_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Esta batalla ya terminó' }, { status: 409 });
    }
    if (groupId !== battle.group_a_id && groupId !== battle.group_b_id) {
      return NextResponse.json({ error: 'Ese grupo no es parte de esta batalla' }, { status: 400 });
    }

    const dayStart = utcDayStart().toISOString();
    const [{ data: groupVotes }, { data: songVotes }, { data: battleVotes }] = await Promise.all([
      supabase.from('votes').select('points').eq('user_id', userId).gte('created_at', dayStart),
      supabase.from('song_votes').select('points').eq('user_id', userId).gte('created_at', dayStart),
      supabase.from('group_battle_votes').select('points').eq('user_id', userId).gte('created_at', dayStart),
    ]);
    const used =
      (groupVotes ?? []).reduce((sum, r) => sum + r.points, 0) +
      (songVotes ?? []).reduce((sum, r) => sum + r.points, 0) +
      (battleVotes ?? []).reduce((sum, r) => sum + r.points, 0);
    if (used + pointsToGive > DAILY_POINT_BUDGET) {
      const remaining = Math.max(0, DAILY_POINT_BUDGET - used);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Solo te quedan ${remaining} de ${DAILY_POINT_BUDGET} puntos hoy.`
              : 'Ya repartiste tus 5 puntos de hoy. Vuelve mañana.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.rpc('cast_group_battle_vote', {
      p_user_id: userId,
      p_battle_id: battleId,
      p_group_id: groupId,
      p_points: pointsToGive,
      p_message: message?.trim() || null,
    });
    if (error) {
      return NextResponse.json({ error: 'Ya no te quedan puntos suficientes hoy.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/group-battle-vote:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
