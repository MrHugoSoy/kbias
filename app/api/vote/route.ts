import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function cooldownMessage(nextVoteAt: Date): string {
  return `Ya votaste. Podrás votar de nuevo el ${nextVoteAt.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}.`;
}

// GET /api/vote — dice si el usuario sigue en cooldown (24h desde su
// último voto, sin importar el grupo) y cuándo puede volver a votar.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: lastVote } = await supabase
    .from('votes')
    .select('group_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastVote) {
    return NextResponse.json({ onCooldown: false, groupId: null, nextVoteAt: null });
  }

  const nextVoteAt = new Date(new Date(lastVote.created_at).getTime() + COOLDOWN_MS);
  const onCooldown = Date.now() < nextVoteAt.getTime();

  return NextResponse.json({
    onCooldown,
    groupId: onCooldown ? lastVote.group_id : null,
    nextVoteAt: onCooldown ? nextVoteAt.toISOString() : null,
  });
}

// POST /api/vote — body: { groupId: string }
//
// El voto es gratis y requiere sesión real (verificada por token, nunca por
// un userId que mande el cliente). Cada cuenta puede votar cada 24 horas
// reales desde su último voto — la función cast_vote() en la base de datos
// es la defensa real contra condiciones de carrera; la consulta de abajo
// solo da un mensaje de error más claro (con la hora exacta) antes de
// intentarlo.
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

    const { data: lastVote } = await supabase
      .from('votes')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastVote) {
      const nextVoteAt = new Date(new Date(lastVote.created_at).getTime() + COOLDOWN_MS);
      if (Date.now() < nextVoteAt.getTime()) {
        return NextResponse.json({ error: cooldownMessage(nextVoteAt) }, { status: 409 });
      }
    }

    const { error } = await supabase.rpc('cast_vote', { p_user_id: userId, p_group_id: groupId });
    if (error) {
      // La función en la base de datos rechazó el voto (condición de
      // carrera: alguien más ganó la carrera desde la consulta de arriba).
      return NextResponse.json({ error: 'Ya votaste hace poco. Inténtalo más tarde.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/vote:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
