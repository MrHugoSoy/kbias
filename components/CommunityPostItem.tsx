'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import UserAvatar from './UserAvatar';
import LevelBadge from './LevelBadge';
import type { CommunityPost, CommunityComment } from '@/lib/types';

const COMMENT_MAX_LENGTH = 300;

export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `Hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function UsernameLink({ username, children }: { username: string | null; children: React.ReactNode }) {
  if (!username) return <span className="text-sm font-semibold">{children}</span>;
  return (
    <Link href={`/usuario/${username}`} className="text-sm font-semibold hover:underline">
      {children}
    </Link>
  );
}

function PostComments({
  postId,
  userId,
  onRequestAuth,
}: {
  postId: string;
  userId: string | null;
  onRequestAuth: (afterAuth: () => void) => void;
}) {
  const [comments, setComments] = useState<CommunityComment[] | null>(null);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/community/posts/comments?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [postId]);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Escribe un comentario');
      return;
    }
    setPosting(true);
    setError('');
    try {
      const res = await authFetch('/api/community/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Algo salió mal, intenta de nuevo');
        return;
      }
      setComments((prev) => [...(prev ?? []), data.comment]);
      setBody('');
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setPosting(false);
    }
  }

  function handlePublish() {
    if (!userId) {
      onRequestAuth(submit);
      return;
    }
    submit();
  }

  return (
    <div className="pl-11 pt-2 mt-2 space-y-3 border-t border-neutral-100 dark:border-neutral-900">
      {comments === null ? (
        <p className="text-xs text-neutral-500">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-neutral-500">Sin comentarios todavía.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <UserAvatar avatarUrl={c.avatar_url} seed={c.user_id} species={c.avatar_species} size={24} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <UsernameLink username={c.username}>{c.username ? `@${c.username}` : 'Un fan'}</UsernameLink>
                <LevelBadge xp={c.xp} />
                <span className="text-[10px] text-neutral-500" suppressHydrationWarning>
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 break-words">{c.body}</p>
            </div>
          </div>
        ))
      )}
      <div className="flex items-center gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
          onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
          placeholder={userId ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
          className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-1.5 text-xs"
        />
        <button
          onClick={handlePublish}
          disabled={posting}
          className="text-xs font-bold text-pink-600 hover:text-pink-500 disabled:opacity-50 shrink-0"
        >
          {posting ? '...' : 'Enviar'}
        </button>
      </div>
      {error && <p className="text-red-500 text-[11px]">{error}</p>}
    </div>
  );
}

export function PostItem({
  post,
  userId,
  liked,
  following,
  onToggleLike,
  onToggleFollow,
  onDelete,
  onRequestAuth,
}: {
  post: CommunityPost;
  userId: string | null;
  liked: boolean;
  following: boolean;
  onToggleLike: (postId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
  onDelete: (postId: string) => void;
  onRequestAuth: (afterAuth: () => void) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const isOwner = !!userId && userId === post.user_id;

  function handleLikeClick() {
    if (!userId) {
      onRequestAuth(() => onToggleLike(post.id));
      return;
    }
    onToggleLike(post.id);
  }

  function handleFollowClick() {
    if (!userId) {
      onRequestAuth(() => onToggleFollow(post.user_id));
      return;
    }
    onToggleFollow(post.user_id);
  }

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <UserAvatar avatarUrl={post.avatar_url} seed={post.user_id} species={post.avatar_species} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <UsernameLink username={post.username}>{post.username ? `@${post.username}` : 'Un fan'}</UsernameLink>
            <LevelBadge xp={post.xp} />
            <span className="text-[10px] text-neutral-500" suppressHydrationWarning>
              {timeAgo(post.created_at)}
            </span>
            {!isOwner && (
              <button
                onClick={handleFollowClick}
                className={
                  'ml-auto text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-full transition shrink-0 ' +
                  (following
                    ? 'text-neutral-500 bg-neutral-100 dark:bg-neutral-900 hover:text-red-500'
                    : 'text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90')
                }
              >
                {following ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" /> Seguir
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 text-pretty break-words whitespace-pre-wrap">
            {post.body}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLikeClick}
              className={
                'text-xs flex items-center gap-1 transition ' +
                (liked ? 'text-pink-500' : 'text-neutral-500 hover:text-pink-500 dark:hover:text-pink-400')
              }
            >
              <Heart className={'w-3.5 h-3.5' + (liked ? ' fill-current' : '')} />
              {post.like_count > 0 ? post.like_count : 'Me gusta'}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="text-xs flex items-center gap-1 text-neutral-500 hover:text-violet-500 dark:hover:text-violet-400 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {post.comment_count > 0 ? post.comment_count : 'Comentar'}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs flex items-center gap-1 text-neutral-500 hover:text-red-500 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
          </div>
          {showComments && <PostComments postId={post.id} userId={userId} onRequestAuth={onRequestAuth} />}
        </div>
      </div>
    </div>
  );
}
