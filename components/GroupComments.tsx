'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, CornerDownRight, Pencil, Trash2, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import UserAvatar from './UserAvatar';
import AuthModal from './AuthModal';

const COMMENT_MAX_LENGTH = 500;

type Comment = {
  id: string;
  group_id: string;
  body: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  user_id: string;
  username: string | null;
  avatar_species: string | null;
  avatar_url: string | null;
  like_count: number;
};

type ActionResult = { ok: boolean; error?: string };

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `Hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

// Profundidad a partir de la cual una respuesta ya no suma más sangría:
// evita que un hilo muy largo (respuesta de respuesta de respuesta...)
// empuje el contenido fuera de pantalla en celular. Sigue siendo
// respondible sin límite — solo deja de indentarse visualmente.
const MAX_INDENT_DEPTH = 4;

function CommentItem({
  comment,
  childrenByParent,
  depth,
  userId,
  canComment,
  likedIds,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  onRequestAuth,
}: {
  comment: Comment;
  childrenByParent: Map<string, Comment[]>;
  depth: number;
  userId: string | null;
  canComment: boolean;
  likedIds: Set<string>;
  onReply: (body: string, parentId: string) => Promise<ActionResult>;
  onEdit: (commentId: string, body: string) => Promise<ActionResult>;
  onDelete: (commentId: string) => Promise<ActionResult>;
  onToggleLike: (commentId: string) => void;
  onRequestAuth: (afterAuth: () => void) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isDeleted = !!comment.deleted_at;
  const isOwner = !!userId && userId === comment.user_id;

  async function submitReply() {
    const trimmed = replyBody.trim();
    if (!trimmed) {
      setError('Escribe una respuesta');
      return;
    }
    setPosting(true);
    setError('');
    const result = await onReply(trimmed, comment.id);
    setPosting(false);
    if (result.ok) {
      setReplyBody('');
      setReplying(false);
    } else {
      setError(result.error || 'Algo salió mal, intenta de nuevo');
    }
  }

  function handleReplyClick() {
    if (!userId) {
      onRequestAuth(() => setReplying(true));
      return;
    }
    setReplying((v) => !v);
  }

  const replyBlocked = !!userId && !canComment;

  function handleLikeClick() {
    if (!userId) {
      onRequestAuth(() => onToggleLike(comment.id));
      return;
    }
    onToggleLike(comment.id);
  }

  async function submitEdit() {
    const trimmed = editBody.trim();
    if (!trimmed) {
      setEditError('Escribe un comentario');
      return;
    }
    setEditSaving(true);
    setEditError('');
    const result = await onEdit(comment.id, trimmed);
    setEditSaving(false);
    if (result.ok) {
      setEditing(false);
    } else {
      setEditError(result.error || 'Algo salió mal, intenta de nuevo');
    }
  }

  function openEdit() {
    // Se toma el body actual justo al abrir (no al montar el componente),
    // para no pisar una edición hecha desde otra pestaña/dispositivo mientras
    // este comentario ya estaba en pantalla.
    setEditBody(comment.body ?? '');
    setEditError('');
    setEditing(true);
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este comentario?')) return;
    setDeleting(true);
    setDeleteError('');
    const result = await onDelete(comment.id);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error || 'Algo salió mal, intenta de nuevo');
    }
  }

  const children = childrenByParent.get(comment.id) ?? [];
  const nextDepth = Math.min(depth + 1, MAX_INDENT_DEPTH);
  const avatarSize = depth === 0 ? 32 : 24;
  const textSize = depth === 0 ? 'text-sm' : 'text-xs';

  return (
    <div id={`comment-${comment.id}`} className="space-y-2 scroll-mt-20">
      <div className="flex gap-3">
        <UserAvatar avatarUrl={comment.avatar_url} seed={comment.user_id} species={comment.avatar_species} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={textSize + ' font-semibold'}>{comment.username ? `@${comment.username}` : 'Un fan'}</span>
            <span className="text-[10px] text-neutral-500" suppressHydrationWarning>
              {timeAgo(comment.created_at)}
              {comment.updated_at && !isDeleted && ' · editado'}
            </span>
          </div>

          {isDeleted ? (
            <p className={textSize + ' text-neutral-400 dark:text-neutral-600 italic'}>Comentario eliminado</p>
          ) : editing ? (
            <div className="mt-1 space-y-1">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                rows={2}
                autoFocus
                className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-xs"
              />
              <div className="flex items-center justify-between">
                {editError && <p className="text-red-500 text-[11px]">{editError}</p>}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => { setEditing(false); setEditBody(comment.body ?? ''); setEditError(''); }}
                    className="text-[11px] text-neutral-500 px-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitEdit}
                    disabled={editSaving}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {editSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={textSize + ' text-neutral-700 dark:text-neutral-300 text-pretty break-words'}>{comment.body}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            {!isDeleted && (
              <button
                onClick={handleLikeClick}
                className={
                  'text-[11px] flex items-center gap-1 transition ' +
                  (likedIds.has(comment.id)
                    ? 'text-pink-500'
                    : 'text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400')
                }
              >
                <Heart className={'w-3 h-3' + (likedIds.has(comment.id) ? ' fill-current' : '')} />
                {comment.like_count > 0 ? comment.like_count : 'Me gusta'}
              </button>
            )}
            <button
              onClick={handleReplyClick}
              className="text-[11px] text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400 flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" /> Responder
            </button>
            {isOwner && !isDeleted && !editing && (
              <>
                <button
                  onClick={openEdit}
                  className="text-[11px] text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[11px] text-neutral-500 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" /> {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </>
            )}
          </div>
          {deleteError && <p className="text-red-500 text-[11px] mt-1">{deleteError}</p>}

          {replying && replyBlocked && (
            <div className="mt-2 flex items-center justify-between gap-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-pink-600 dark:text-pink-400">
                Necesitas darle puntos a este grupo hoy para responder.
              </p>
              <button onClick={() => setReplying(false)} className="text-[11px] text-neutral-500 shrink-0">
                Cerrar
              </button>
            </div>
          )}

          {replying && !replyBlocked && (
            <div className="mt-2 space-y-1">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                placeholder={`Responder a ${comment.username ? `@${comment.username}` : 'este comentario'}...`}
                rows={2}
                autoFocus
                className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-xs"
              />
              <div className="flex items-center justify-between">
                {error && <p className="text-red-500 text-[11px]">{error}</p>}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => { setReplying(false); setReplyBody(''); setError(''); }}
                    className="text-[11px] text-neutral-500 px-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={posting}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {posting ? 'Enviando...' : 'Responder'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div
              className={
                'mt-3 space-y-3' +
                (depth < MAX_INDENT_DEPTH ? ' pl-4 border-l-2 border-neutral-100 dark:border-neutral-900' : '')
              }
            >
              {children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  childrenByParent={childrenByParent}
                  depth={nextDepth}
                  userId={userId}
                  canComment={canComment}
                  likedIds={likedIds}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleLike={onToggleLike}
                  onRequestAuth={onRequestAuth}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GroupComments({ groupId, initialComments }: { groupId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<(() => void) | null>(null);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [votedGroupToday, setVotedGroupToday] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLikedIds(new Set());
      return;
    }
    authFetch(`/api/comments/likes?groupId=${groupId}`)
      .then((res) => res.json())
      .then((data) => setLikedIds(new Set<string>(data.likedCommentIds ?? [])));
  }, [userId, groupId]);

  // Solo se puede comentar/responder en la sección de un grupo si ya se le
  // dieron puntos a ESE grupo hoy — mismo límite de día calendario UTC que
  // usa /api/comments para rechazar el POST en el servidor.
  useEffect(() => {
    if (!userId) {
      setVotedGroupToday(false);
      return;
    }
    authFetch(`/api/vote?groupId=${groupId}`)
      .then((res) => res.json())
      .then((data) => setVotedGroupToday(!!data.votedGroupToday));
  }, [userId, groupId]);

  const canComment = !!userId && votedGroupToday;

  useEffect(() => {
    const channel = supabase
      .channel(`group-comments-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_comments', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const row = payload.new as {
            id: string;
            group_id: string;
            body: string | null;
            parent_id: string | null;
            created_at: string;
            updated_at: string | null;
            deleted_at: string | null;
            user_id: string;
          };
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              { ...row, username: null, avatar_species: null, avatar_url: null, like_count: 0 },
              ...prev,
            ];
          });
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_species, avatar_url')
            .eq('id', row.user_id)
            .maybeSingle();
          if (profile) {
            setComments((prev) => prev.map((c) => (c.id === row.id ? { ...c, ...profile } : c)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_comments', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            body: string | null;
            updated_at: string | null;
            deleted_at: string | null;
          };
          setComments((prev) =>
            prev.map((c) =>
              c.id === row.id ? { ...c, body: row.body, updated_at: row.updated_at, deleted_at: row.deleted_at } : c
            )
          );
        }
      )
      // comment_likes no tiene group_id propio (sería una columna redundante
      // solo para poder filtrar acá), así que se escucha sin filtro de la
      // tabla completa y se descarta lo que no sea de un comentario ya
      // cargado en este grupo — así los contadores se ven en vivo para
      // todos los que tengan la página abierta, no solo para quien dio like.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comment_likes' },
        (payload) => {
          const row = payload.new as { comment_id: string; user_id: string };
          // El propio like ya se refleja al instante con la respuesta del
          // POST — aplicar este evento también lo contaría dos veces.
          if (row.user_id === userId) return;
          setComments((prev) =>
            prev.map((c) => (c.id === row.comment_id ? { ...c, like_count: c.like_count + 1 } : c))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comment_likes' },
        (payload) => {
          const row = payload.old as { comment_id: string; user_id: string };
          if (row.user_id === userId) return;
          setComments((prev) =>
            prev.map((c) => (c.id === row.comment_id ? { ...c, like_count: Math.max(0, c.like_count - 1) } : c))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, userId]);

  async function postComment(commentBody: string, parentId?: string): Promise<ActionResult> {
    try {
      const res = await authFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, body: commentBody, parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Algo salió mal' };
      }
      setComments((prev) => (prev.some((c) => c.id === data.comment.id) ? prev : [data.comment, ...prev]));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión, intenta de nuevo' };
    }
  }

  async function editComment(commentId: string, newBody: string): Promise<ActionResult> {
    try {
      const res = await authFetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, body: newBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Algo salió mal' };
      }
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...data.comment } : c)));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión, intenta de nuevo' };
    }
  }

  async function deleteComment(commentId: string): Promise<ActionResult> {
    try {
      const res = await authFetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Algo salió mal' };
      }
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...data.comment } : c)));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión, intenta de nuevo' };
    }
  }

  async function toggleLike(commentId: string) {
    const wasLiked = likedIds.has(commentId);
    const delta = wasLiked ? -1 : 1;

    // Optimista: se ve al instante. El realtime de comment_likes ignora los
    // eventos generados por uno mismo (ver el filtro user_id === userId
    // arriba) precisamente para no contar este cambio dos veces.
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: c.like_count + delta } : c)));

    try {
      const res = await authFetch('/api/comments/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: data.likeCount } : c)));
        return;
      }
    } catch {
      // sigue al revert de abajo
    }
    // Falló: revierte el optimista.
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.add(commentId) : next.delete(commentId);
      return next;
    });
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: c.like_count - delta } : c)));
  }

  async function handleSubmit() {
    setError('');
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Escribe un comentario');
      return;
    }
    setPosting(true);
    const result = await postComment(trimmed);
    if (result.ok) {
      setBody('');
    } else {
      setError(result.error || 'Algo salió mal');
    }
    setPosting(false);
  }

  async function handlePostClick() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPendingAfterAuth(() => handleSubmit);
      setShowAuth(true);
      return;
    }
    handleSubmit();
  }

  function requestAuth(afterAuth: () => void) {
    setPendingAfterAuth(() => afterAuth);
    setShowAuth(true);
  }

  // Un solo mapa parent_id -> hijos alcanza para cualquier profundidad: una
  // respuesta es, para efectos de este mapa, igual que un comentario de
  // primer nivel — solo que su propio parent_id no es null.
  const topLevel = comments.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.parent_id) continue;
    if (!childrenByParent.has(c.parent_id)) childrenByParent.set(c.parent_id, []);
    childrenByParent.get(c.parent_id)!.push(c);
  }
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-pink-500" /> Zona de fans
      </h2>

      {userId && !votedGroupToday ? (
        <div className="bg-pink-50 dark:bg-pink-950/30 rounded-lg px-4 py-3 text-sm text-pink-600 dark:text-pink-400">
          Necesitas darle puntos a este grupo hoy para comentar. Dale tus puntos arriba y vuelve a esta sección.
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
            placeholder={userId ? 'Comparte tu opinión sobre este grupo...' : 'Inicia sesión para comentar'}
            rows={3}
            className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-neutral-500">
              {body.length}/{COMMENT_MAX_LENGTH}
            </p>
            <button
              onClick={handlePostClick}
              disabled={posting}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {posting ? 'Publicando...' : 'Comentar'}
            </button>
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        </div>
      )}

      <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
        {topLevel.length === 0 && (
          <p className="text-center text-neutral-500 py-6 text-sm">Sin comentarios todavía — ¡sé el primero!</p>
        )}
        {topLevel.map((c) => (
          <div key={c.id} className="px-4 py-3">
            <CommentItem
              comment={c}
              childrenByParent={childrenByParent}
              depth={0}
              userId={userId}
              likedIds={likedIds}
              canComment={canComment}
              onReply={postComment}
              onEdit={editComment}
              onDelete={deleteComment}
              onToggleLike={toggleLike}
              onRequestAuth={requestAuth}
            />
          </div>
        ))}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false); setPendingAfterAuth(null); }}
          onAuthed={() => {
            setShowAuth(false);
            pendingAfterAuth?.();
            setPendingAfterAuth(null);
          }}
        />
      )}
    </section>
  );
}
