import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';
import { MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';
import { utcDayStart } from '@/lib/dailyWindow';

export const dynamic = 'force-dynamic';

const DAILY_POINT_BUDGET = 5;

function utcDayReset(): Date {
  const start = utcDayStart();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

async function pointsUsedToday(supabase: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const { data } = await supabase
    .from('votes')
    .select('points')
    .eq('user_id', userId)
    .gte('created_at', utcDayStart().toISOString());
  return (data ?? []).reduce((sum, row) => sum + row.points, 0);
}

// GET /api/vote — cuántos de los 5 puntos diarios ya se repartieron hoy
// (día calendario UTC) y a qué hora se recargan. Si viene ?groupId=, además
// dice si esa cuenta ya le dio puntos a ESE grupo hoy (lo usa GroupComments
// para saber si puede comentar en la página de ese grupo).
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const used = await pointsUsedToday(supabase, userId);

  const groupId = req.nextUrl.searchParams.get('groupId');
  let votedGroupToday = false;
  if (groupId) {
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .gte('created_at', utcDayStart().toISOString())
      .limit(1)
      .maybeSingle();
    votedGroupToday = !!data;
  }

  return NextResponse.json({
    pointsUsedToday: used,
    pointsRemaining: Math.max(0, DAILY_POINT_BUDGET - used),
    dailyBudget: DAILY_POINT_BUDGET,
    resetAt: utcDayReset().toISOString(),
    votedGroupToday,
  });
}

// POST /api/vote — body: { groupId: string, points: number, message?: string }
//
// Cada cuenta tiene 5 puntos gratis por día calendario (UTC) para repartir
// entre los grupos que quiera — la función cast_vote() en la base de datos
// es la defensa real contra condiciones de carrera; la consulta de abajo
// solo da un mensaje de error más claro antes de intentarlo.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { groupId, points, message } = await req.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
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

    const { data: group } = await supabase.from('groups').select('id').eq('id', groupId).maybeSingle();
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const used = await pointsUsedToday(supabase, userId);
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

    const { error } = await supabase.rpc('cast_vote', {
      p_user_id: userId,
      p_group_id: groupId,
      p_points: pointsToGive,
      p_message: message?.trim() || null,
    });
    if (error) {
      // La función en la base de datos rechazó la asignación (condición de
      // carrera: alguien más ganó la carrera desde la consulta de arriba).
      return NextResponse.json({ error: 'Ya no te quedan puntos suficientes hoy.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/vote:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
