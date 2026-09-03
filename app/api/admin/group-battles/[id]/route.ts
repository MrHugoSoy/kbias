import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedAdminUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/group-battles/[id] — cancela una batalla (borra también
// sus votos en cascada, ver `on delete cascade` en group_battle_votes).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { error } = await supabase.from('group_battles').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
