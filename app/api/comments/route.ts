import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getVerifiedUserId } from '@/lib/authServer';
import { isOffensive } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

const COMMENT_MAX_LENGTH = 500;

// Validación compartida entre POST (crear) y PATCH (editar) — antes vivía
// duplicada en los dos handlers, con el riesgo real de que un cambio de
// moderación se aplicara a uno y se olvidara en el otro.
function validateCommentBody(body: unknown): { error: string | null; trimmed: string } {
  if (!body || typeof body !== 'string' || !body.trim()) {
    return { error: 'Escribe un comentario', trimmed: '' };
  }
  const trimmed = body.trim();
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return { error: `El comentario no puede pasar de ${COMMENT_MAX_LENGTH} caracteres`, trimmed };
  }
  if (isOffensive(trimmed)) {
    return { error: 'Ese comentario no está permitido. Intenta con otro.', trimmed };
  }
  return { error: null, trimmed };
}

// GET /api/comments?groupId=xxx — público, comentarios del grupo (mensaje
// principal + respuestas). Sin límite: a diferencia de un feed de
// actividad, aquí un tope fijo puede dejar respuestas huérfanas si su
// comentario padre es más viejo que las últimas N filas.
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
    .order('created_at', { ascending: false });

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
    if (!groupId) {
      return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });
    }
    const { error: validationError, trimmed } = validateCommentBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const [{ data: group }, { data: parent }] = await Promise.all([
      supabase.from('groups').select('id').eq('id', groupId).maybeSingle(),
      parentId
        ? supabase.from('group_comments').select('group_id').eq('id', parentId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }
    if (parentId && (!parent || parent.group_id !== groupId)) {
      return NextResponse.json({ error: 'Comentario original no encontrado' }, { status: 404 });
    }

    const { data: inserted, error } = await supabase
      .from('group_comments')
      .insert({ group_id: groupId, user_id: userId, body: trimmed, parent_id: parentId || null })
      .select('id, group_id, body, parent_id, created_at, updated_at, deleted_at, user_id')
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

// PATCH /api/comments — body: { commentId: string, body: string }
//
// Solo el autor puede editar su propio comentario. Marca updated_at (para
// que el feed muestre "· editado") solo si el texto realmente cambió. El
// `.is('deleted_at', null)` en el update — no solo en la lectura previa —
// es lo que evita que un DELETE concurrente (entre el chequeo y el update)
// termine "resucitando" el body de un comentario que ya se marcó borrado.
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const userId = await getVerifiedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { commentId, body } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: 'Falta commentId' }, { status: 400 });
    }
    const { error: validationError, trimmed } = validateCommentBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('group_comments')
      .select('user_id, body, deleted_at')
      .eq('id', commentId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'No puedes editar el comentario de otra persona' }, { status: 403 });
    }
    if (existing.deleted_at) {
      return NextResponse.json({ error: 'Este comentario ya fue eliminado' }, { status: 400 });
    }

    // Sin cambios reales: no tocar updated_at para no mostrar "· editado"
    // por un guardado accidental del mismo texto.
    if (existing.body === trimmed) {
      const { data: unchanged } = await supabase
        .from('group_comments')
        .select('id, group_id, body, parent_id, created_at, updated_at, deleted_at, user_id')
        .eq('id', commentId)
        .single();
      return NextResponse.json({ comment: unchanged });
    }

    const { data: updated, error } = await supabase
      .from('group_comments')
      .update({ body: trimmed, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .is('deleted_at', null)
      .select('id, group_id, body, parent_id, created_at, updated_at, deleted_at, user_id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }
    if (!updated) {
      // Alguien lo borró justo entre el chequeo de arriba y este update.
      return NextResponse.json({ error: 'Este comentario ya fue eliminado' }, { status: 400 });
    }

    return NextResponse.json({ comment: updated });
  } catch (err) {
    console.error('Error en PATCH /api/comments:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}

// DELETE /api/comments — body: { commentId: string }
//
// Borrado suave: limpia el body y marca deleted_at, pero deja la fila para
// no romper el hilo de respuestas que cuelgan de ella.
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
      .from('group_comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'No puedes eliminar el comentario de otra persona' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('group_comments')
      .update({ body: null, deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .is('deleted_at', null)
      .select('id, group_id, body, parent_id, created_at, updated_at, deleted_at, user_id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
    }
    if (!updated) {
      // Ya estaba borrado (doble clic, dos pestañas) — no hay nada más que hacer.
      const { data: already } = await supabase
        .from('group_comments')
        .select('id, group_id, body, parent_id, created_at, updated_at, deleted_at, user_id')
        .eq('id', commentId)
        .single();
      return NextResponse.json({ comment: already });
    }

    return NextResponse.json({ comment: updated });
  } catch (err) {
    console.error('Error en DELETE /api/comments:', err);
    return NextResponse.json({ error: 'Algo salió mal, intenta de nuevo' }, { status: 500 });
  }
}
