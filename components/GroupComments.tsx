'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, CornerDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import PixelAvatar from './PixelAvatar';
import AuthModal from './AuthModal';

const COMMENT_MAX_LENGTH = 500;

type Comment = {
  id: string;
  group_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_species: string | null;
  avatar_url: string | null;
};

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

function CommentAuthor({ c, size }: { c: Comment; size: number }) {
  return c.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.avatar_url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <PixelAvatar seed={c.user_id} species={c.avatar_species} size={size} />
  );
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
  onReply,
  onRequestAuth,
}: {
  comment: Comment;
  childrenByParent: Map<string, Comment[]>;
  depth: number;
  userId: string | null;
  onReply: (body: string, parentId: string) => Promise<{ ok: boolean; error?: string }>;
  onRequestAuth: (afterAuth: () => void) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

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

  const children = childrenByParent.get(comment.id) ?? [];
  const nextDepth = Math.min(depth + 1, MAX_INDENT_DEPTH);
  const avatarSize = depth === 0 ? 32 : 24;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <CommentAuthor c={comment} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={depth === 0 ? 'text-sm font-semibold' : 'text-xs font-semibold'}>
              {comment.username ? `@${comment.username}` : 'Un fan'}
            </span>
            <span className="text-[10px] text-neutral-500" suppressHydrationWarning>
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className={(depth === 0 ? 'text-sm' : 'text-xs') + ' text-neutral-700 dark:text-neutral-300 text-pretty break-words'}>
            {comment.body}
          </p>
          <button
            onClick={handleReplyClick}
            className="text-[11px] text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400 mt-1 flex items-center gap-1"
          >
            <CornerDownRight className="w-3 h-3" /> Responder
          </button>

          {replying && (
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
                  onReply={onReply}
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

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
            body: string;
            parent_id: string | null;
            created_at: string;
            user_id: string;
          };
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              { ...row, username: null, avatar_species: null, avatar_url: null },
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function postComment(commentBody: string, parentId?: string): Promise<{ ok: boolean; error?: string }> {
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
              onReply={postComment}
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
