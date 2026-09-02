import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';
import { utcDayStart } from '@/lib/dailyWindow';

export const dynamic = 'force-dynamic';

const DAILY_POINT_BUDGET = 5;

// POST /api/song-vote — body: { battleId, songId, points, message? }
//
// Mismo presupuesto de 5 puntos diarios que /api/vote (compartido entre
// votos de grupo y de canciones) — cast_song_vote() en la base de datos es
// la defensa real contra condiciones de carrera; la consulta de abajo solo
// da un mensaje de error más claro antes de intentarlo.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { battleId, songId, points, message } = await req.json();
    if (!battleId || !songId) {
      return NextResponse.json({ error: 'Falta battleId o songId' }, { status: 400 });
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

    const { data: battle } = await supabase.from('song_battles').select('id, song_a_id, song_b_id, ends_at').eq('id', battleId).maybeSingle();
    if (!battle) {
      return NextResponse.json({ error: 'Batalla no encontrada' }, { status: 404 });
    }
    if (new Date(battle.ends_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Esta batalla ya terminó' }, { status: 409 });
    }
    if (songId !== battle.song_a_id && songId !== battle.song_b_id) {
      return NextResponse.json({ error: 'Esa canción no es parte de esta batalla' }, { status: 400 });
    }

    const dayStart = utcDayStart().toISOString();
    const [{ data: groupVotes }, { data: songVotes }] = await Promise.all([
      supabase.from('votes').select('points').eq('user_id', userId).gte('created_at', dayStart),
      supabase.from('song_votes').select('points').eq('user_id', userId).gte('created_at', dayStart),
    ]);
    const used =
      (groupVotes ?? []).reduce((sum, r) => sum + r.points, 0) + (songVotes ?? []).reduce((sum, r) => sum + r.points, 0);
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

    const { error } = await supabase.rpc('cast_song_vote', {
      p_user_id: userId,
      p_battle_id: battleId,
      p_song_id: songId,
      p_points: pointsToGive,
      p_message: message?.trim() || null,
    });
    if (error) {
      return NextResponse.json({ error: 'Ya no te quedan puntos suficientes hoy.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/song-vote:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
