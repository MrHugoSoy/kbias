import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedAdminUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 24 * 30; // 30 días, tope generoso contra un typo

// GET /api/admin/group-battles — todas las batallas de grupo (para el
// panel), con ambos lados y su status ya resueltos por la vista.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await supabase.from('group_battle_feed').select('*').limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ battles: data ?? [] });
}

// POST /api/admin/group-battles — body: { groupAId, groupBId, startsAt?, durationHours? }
// Empareja dos grupos a mano. ensure_active_group_battles() (el emparejado
// automático) solo arma batallas nuevas cuando NO queda ninguna vigente ni
// programada — así que mientras el admin mantenga al menos una batalla sin
// terminar, el emparejado al azar no interfiere con el que arma a mano.
export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const groupAId = typeof payload?.groupAId === 'string' ? payload.groupAId : '';
  const groupBId = typeof payload?.groupBId === 'string' ? payload.groupBId : '';
  const startsAtInput = typeof payload?.startsAt === 'string' && payload.startsAt ? payload.startsAt : null;
  const durationHours = Number(payload?.durationHours ?? 120);

  if (!groupAId || !groupBId) {
    return NextResponse.json({ error: 'Elige los dos grupos' }, { status: 400 });
  }
  if (groupAId === groupBId) {
    return NextResponse.json({ error: 'Los dos lados deben ser grupos distintos' }, { status: 400 });
  }
  if (!Number.isFinite(durationHours) || durationHours < MIN_DURATION_HOURS || durationHours > MAX_DURATION_HOURS) {
    return NextResponse.json({ error: `La duración debe ser entre ${MIN_DURATION_HOURS} y ${MAX_DURATION_HOURS} horas` }, { status: 400 });
  }

  const startsAt = startsAtInput ? new Date(startsAtInput) : new Date();
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Fecha de inicio inválida' }, { status: 400 });
  }
  const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);

  const { data: groupRows } = await supabase.from('groups').select('id').in('id', [groupAId, groupBId]);
  if ((groupRows ?? []).length !== 2) {
    return NextResponse.json({ error: 'Uno de los grupos no existe' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_battles')
    .insert({ group_a_id: groupAId, group_b_id: groupBId, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ battle: data });
}
