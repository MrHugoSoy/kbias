import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedAdminUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

const TITLE_MAX_LENGTH = 140;
const BODY_MAX_LENGTH = 4000;

// GET /api/admin/news — lista todas las noticias (para el panel), sin
// filtrar por grupo, más recientes primero.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, body, cover_url, group_id, published_at, group:groups(name, slug)')
    .order('published_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

// POST /api/admin/news — body: { title, body, coverUrl?, groupId? }
export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const adminId = await getVerifiedAdminUserId(req, supabase);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  const coverUrl = typeof payload?.coverUrl === 'string' && payload.coverUrl.trim() ? payload.coverUrl.trim() : null;
  const groupId = typeof payload?.groupId === 'string' && payload.groupId ? payload.groupId : null;

  if (!title || title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json({ error: `El título es obligatorio (máx. ${TITLE_MAX_LENGTH} caracteres)` }, { status: 400 });
  }
  if (!body || body.length > BODY_MAX_LENGTH) {
    return NextResponse.json({ error: `El cuerpo es obligatorio (máx. ${BODY_MAX_LENGTH} caracteres)` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('news_posts')
    .insert({ title, body, cover_url: coverUrl, group_id: groupId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
