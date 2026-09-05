import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

const COMMENT_MAX_LENGTH = 300;

// GET /api/community/posts/comments?postId=xxx — público, comentarios de
// esa publicación (planos, sin hilos por ahora).
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId');
  if (!postId) {
    return NextResponse.json({ error: 'Falta postId' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('community_post_comments')
    .select('id, post_id, body, created_at, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error en GET /api/community/posts/comments:', error);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  // Sin FK de community_post_comments hacia profiles (ambas apuntan a
  // auth.users por separado), así que PostgREST no puede resolver un embed
  // profiles(...) en la consulta de arriba — se junta a mano en JS.
  const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, username, avatar_species, avatar_url, xp').in('id', userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const comments = (data ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      id: row.id,
      post_id: row.post_id,
      body: row.body,
      created_at: row.created_at,
      user_id: row.user_id,
      username: profile?.username ?? null,
      avatar_species: profile?.avatar_species ?? null,
      avatar_url: profile?.avatar_url ?? null,
      xp: profile?.xp ?? 0,
    };
  });

  return NextResponse.json({ comments });
}

// POST /api/community/posts/comments — body: { postId: string, body: string }
//
// Requiere sesión real (verificada por token). Cualquier usuario logueado
// puede comentar cualquier publicación del feed — a diferencia de la Zona
// de fans de un grupo, aquí no hace falta haber votado antes.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId, body } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'Falta postId' }, { status: 400 });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Escribe un comentario' }, { status: 400 });
    }
    const trimmed = body.trim();
    if (trimmed.length > COMMENT_MAX_LENGTH) {
      return NextResponse.json({ error: `El comentario no puede pasar de ${COMMENT_MAX_LENGTH} caracteres` }, { status: 400 });
    }
    if (isOffensive(trimmed)) {
      return NextResponse.json({ error: 'Ese comentario no está permitido. Intenta con otro.' }, { status: 400 });
    }

    const { data: post } = await supabase.from('community_posts').select('id').eq('id', postId).maybeSingle();
    if (!post) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    const { data: inserted, error } = await supabase
      .from('community_post_comments')
      .insert({ post_id: postId, user_id: userId, body: trimmed })
      .select('id, post_id, body, created_at, user_id')
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_species, avatar_url, xp')
      .eq('id', userId)
      .maybeSingle();

    return NextResponse.json({
      comment: {
        ...inserted,
        username: profile?.username ?? null,
        avatar_species: profile?.avatar_species ?? null,
        avatar_url: profile?.avatar_url ?? null,
        xp: profile?.xp ?? 0,
      },
    });
  } catch (err) {
    console.error('Error en /api/community/posts/comments:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}

// DELETE /api/community/posts/comments — body: { commentId: string }
//
// Solo el autor puede borrar su propio comentario. Borrado duro (sin
// respuestas colgando de un comentario en v1, no hace falta el suave).
export async function DELETE(req: NextRequest) {
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

    const { data: existing } = await supabase
      .from('community_post_comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'No puedes eliminar el comentario de otra persona' }, { status: 403 });
    }

    const { error } = await supabase.from('community_post_comments').delete().eq('id', commentId);
    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en DELETE /api/community/posts/comments:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
