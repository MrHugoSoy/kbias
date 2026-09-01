import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// GET /api/notifications — las últimas alertas del usuario autenticado.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notifications_feed')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications — body: { id?: string } marca una como leída, o
// todas si no viene id.
export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({}));

  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (id) query = query.eq('id', id);

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
