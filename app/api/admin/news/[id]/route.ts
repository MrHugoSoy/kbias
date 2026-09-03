import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedAdminUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

const TITLE_MAX_LENGTH = 140;
const BODY_MAX_LENGTH = 4000;

// PATCH /api/admin/news/[id] — body: { title, body, coverUrl?, category?, groupId? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  const coverUrl = typeof payload?.coverUrl === 'string' && payload.coverUrl.trim() ? payload.coverUrl.trim() : null;
  const category = typeof payload?.category === 'string' && payload.category.trim() ? payload.category.trim() : null;
  const groupId = typeof payload?.groupId === 'string' && payload.groupId ? payload.groupId : null;

  if (!title || title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json({ error: `El título es obligatorio (máx. ${TITLE_MAX_LENGTH} caracteres)` }, { status: 400 });
  }
  if (!body || body.length > BODY_MAX_LENGTH) {
    return NextResponse.json({ error: `El cuerpo es obligatorio (máx. ${BODY_MAX_LENGTH} caracteres)` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('news_posts')
    .update({ title, body, cover_url: coverUrl, category, group_id: groupId })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// DELETE /api/admin/news/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { error } = await supabase.from('news_posts').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
