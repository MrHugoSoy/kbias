import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// GET /api/vote — devuelve si el usuario actual ya votó hoy y por qué grupo.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const { data: existingVote } = await supabase
    .from('votes')
    .select('group_id')
    .eq('user_id', userId)
    .gte('created_at', startOfDayUtc.toISOString())
    .maybeSingle();

  return NextResponse.json({ votedToday: !!existingVote, groupId: existingVote?.group_id ?? null });
}

// POST /api/vote — body: { groupId: string }
//
// El voto es gratis y requiere sesión real (verificada por token, nunca por
// un userId que mande el cliente). Cada cuenta puede votar una vez por día
// calendario (UTC): el índice único idx_votes_one_per_day en la base de
// datos es la defensa real contra condiciones de carrera; la consulta de
// abajo solo da un mensaje de error más claro antes de intentar el insert.
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

    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfDayUtc.toISOString())
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json({ error: 'Ya votaste hoy. Vuelve mañana.' }, { status: 409 });
    }

    const { error } = await supabase.from('votes').insert({ user_id: userId, group_id: groupId });
    if (error) {
      // Índice único: alguien ya votó hoy (condición de carrera) o error real.
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya votaste hoy. Vuelve mañana.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/vote:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
