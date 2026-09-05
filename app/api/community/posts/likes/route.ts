import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

// GET /api/community/posts/likes — ids de las publicaciones del feed a las
// que el usuario autenticado ya les dio like (el feed es general, así que
// a diferencia de /api/comments/likes no hace falta filtrar por grupo).
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const userId = await getVerifiedUserId(req, supabase);
  if (!userId) {
    return NextResponse.json({ likedPostIds: [] });
  }

  const { data, error } = await supabase.from('community_post_likes').select('post_id').eq('user_id', userId);
  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ likedPostIds: (data ?? []).map((row) => row.post_id) });
}

// POST /api/community/posts/likes — body: { postId: string }
//
// Toggle: si el usuario ya le dio like a esa publicación, lo quita; si no,
// lo agrega. Requiere sesión real (verificada por token).
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'Falta postId' }, { status: 400 });
    }

    const { data: post } = await supabase.from('community_posts').select('id').eq('id', postId).maybeSingle();
    if (!post) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('community_post_likes').delete().eq('id', existing.id);
      if (error) return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    } else {
      const { error } = await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
      // 23505 = ya existía (doble clic/dos pestañas ganándole la carrera al chequeo de arriba) — no es un error real.
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from('community_post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({ liked: !existing, likeCount: count ?? 0 });
  } catch (err) {
    console.error('Error en /api/community/posts/likes:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
