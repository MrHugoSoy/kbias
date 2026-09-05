import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

const POST_MAX_LENGTH = 280;

// GET /api/community/posts — público, últimas publicaciones del feed con
// autor y contadores ya armados (community_feed en supabase/schema.sql).
export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from('community_feed').select('*').limit(50);

  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

// POST /api/community/posts — body: { body: string }
//
// Requiere sesión real (verificada por token). Se modera con el mismo
// filtro que comentarios y mensajes de voto antes de guardarse.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { body } = await req.json();
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Escribe algo para publicar' }, { status: 400 });
    }
    const trimmed = body.trim();
    if (trimmed.length > POST_MAX_LENGTH) {
      return NextResponse.json({ error: `La publicación no puede pasar de ${POST_MAX_LENGTH} caracteres` }, { status: 400 });
    }
    if (isOffensive(trimmed)) {
      return NextResponse.json({ error: 'Esa publicación no está permitida. Intenta con otra.' }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, body: trimmed })
      .select('id, body, created_at, user_id')
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
      post: {
        ...inserted,
        username: profile?.username ?? null,
        avatar_species: profile?.avatar_species ?? null,
        avatar_url: profile?.avatar_url ?? null,
        xp: profile?.xp ?? 0,
        like_count: 0,
        comment_count: 0,
      },
    });
  } catch (err) {
    console.error('Error en /api/community/posts:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}

// DELETE /api/community/posts — body: { postId: string }
//
// Solo el autor puede borrar su propia publicación. Borrado duro: sin
// hilos que dependan de ella (a diferencia de group_comments), así que no
// hace falta el borrado suave — el cascade en la base de datos se lleva
// sus likes y comentarios.
export async function DELETE(req: NextRequest) {
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

    const { data: existing } = await supabase.from('community_posts').select('user_id').eq('id', postId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'No puedes eliminar la publicación de otra persona' }, { status: 403 });
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en DELETE /api/community/posts:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
