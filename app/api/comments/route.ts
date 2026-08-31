import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

const COMMENT_MAX_LENGTH = 500;

// GET /api/comments?groupId=xxx — público, últimos 50 comentarios del grupo.
export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get('groupId');
  if (!groupId) {
    return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('group_comments_feed')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

// POST /api/comments — body: { groupId: string, body: string, parentId?: string }
//
// Requiere sesión real (verificada por token). El comentario se modera con
// el mismo filtro que los mensajes de voto antes de guardarse. Si viene
// parentId, se valida que exista y sea del mismo grupo — así nadie puede
// colgar una respuesta de un comentario ajeno a otro grupo.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { groupId, body, parentId } = await req.json();
    if (!groupId || !body || !body.trim()) {
      return NextResponse.json({ error: 'Escribe un comentario' }, { status: 400 });
    }
    const trimmed = body.trim();
    if (trimmed.length > COMMENT_MAX_LENGTH) {
      return NextResponse.json({ error: `El comentario no puede pasar de ${COMMENT_MAX_LENGTH} caracteres` }, { status: 400 });
    }
    if (isOffensive(trimmed)) {
      return NextResponse.json({ error: 'Ese comentario no está permitido. Intenta con otro.' }, { status: 400 });
    }

    const { data: group } = await supabase.from('groups').select('id').eq('id', groupId).maybeSingle();
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    if (parentId) {
      const { data: parent } = await supabase.from('group_comments').select('group_id').eq('id', parentId).maybeSingle();
      if (!parent || parent.group_id !== groupId) {
        return NextResponse.json({ error: 'Comentario original no encontrado' }, { status: 404 });
      }
    }

    const { data: inserted, error } = await supabase
      .from('group_comments')
      .insert({ group_id: groupId, user_id: userId, body: trimmed, parent_id: parentId || null })
      .select('id, group_id, body, parent_id, created_at, user_id')
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_species, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    return NextResponse.json({
      comment: {
        ...inserted,
        username: profile?.username ?? null,
        avatar_species: profile?.avatar_species ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
    });
  } catch (err) {
    console.error('Error en /api/comments:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
