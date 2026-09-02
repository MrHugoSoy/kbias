import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// GET /api/comments/likes?groupId=xxx — ids de los comentarios de ese
// grupo a los que el usuario autenticado ya les dio like. Los comentarios
// en sí y su like_count vienen del server component (group_comments_feed);
// esto solo resuelve el estado "¿ya le di like?", que depende de quién
// pregunta y por eso no puede venir precalculado ahí.
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) {
    return NextResponse.json({ likedCommentIds: [] });
  }

  const groupId = req.nextUrl.searchParams.get('groupId');
  if (!groupId) {
    return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id, group_comments!inner(group_id)')
    .eq('user_id', userId)
    .eq('group_comments.group_id', groupId);

  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ likedCommentIds: (data ?? []).map((row) => row.comment_id) });
}

// POST /api/comments/likes — body: { commentId: string }
//
// Toggle: si el usuario ya le dio like a ese comentario, lo quita; si no,
// lo agrega. Requiere sesión real (verificada por token).
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: 'Falta commentId' }, { status: 400 });
    }

    const { data: comment } = await supabase.from('group_comments').select('id').eq('id', commentId).maybeSingle();
    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id);
      if (error) return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    } else {
      const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
      // 23505 = ya existía (doble clic/dos pestañas ganándole la carrera al chequeo de arriba) — no es un error real.
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from('comment_likes')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return NextResponse.json({ liked: !existing, likeCount: count ?? 0 });
  } catch (err) {
    console.error('Error en /api/comments/likes:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
