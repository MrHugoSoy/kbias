'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import UserAvatar from './UserAvatar';
import LevelBadge from './LevelBadge';
import AuthModal from './AuthModal';
import type { CommunityPost, CommunityComment } from '@/lib/types';

const POST_MAX_LENGTH = 280;
const COMMENT_MAX_LENGTH = 300;

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
                <span className="text-xs font-semibold">{c.username ? `@${c.username}` : 'Un fan'}</span>
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

function PostItem({
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
            <span className="text-sm font-semibold">{post.username ? `@${post.username}` : 'Un fan'}</span>
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

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<(() => void) | null>(null);
  const [composerBody, setComposerBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch('/api/community/posts');
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // deja el feed como estaba — sin esto un fallo de red pasajero limpiaría posts ya cargados
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLikedIds(new Set());
      return;
    }
    authFetch('/api/community/posts/likes')
      .then((res) => res.json())
      .then((data) => setLikedIds(new Set<string>(data.likedPostIds ?? [])));
  }, [userId]);

  // A quién sigue el usuario actual — lectura pública (user_follows tiene
  // policy de select true), así que se consulta directo con el cliente
  // anon en vez de pasar por un endpoint dedicado.
  useEffect(() => {
    if (!userId) {
      setFollowingIds(new Set());
      return;
    }
    supabase
      .from('user_follows')
      .select('followee_id')
      .eq('follower_id', userId)
      .then(({ data }) => setFollowingIds(new Set<string>((data ?? []).map((row) => row.followee_id))));
  }, [userId]);

  async function submitPost() {
    const trimmed = composerBody.trim();
    if (!trimmed) {
      setError('Escribe algo para publicar');
      return;
    }
    setPosting(true);
    setError('');
    try {
      const res = await authFetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Algo salió mal, intenta de nuevo');
        return;
      }
      setPosts((prev) => [data.post, ...(prev ?? [])]);
      setComposerBody('');
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setPosting(false);
    }
  }

  function handlePublishClick() {
    if (!userId) {
      setPendingAfterAuth(() => submitPost);
      setShowAuth(true);
      return;
    }
    submitPost();
  }

  function requestAuth(afterAuth: () => void) {
    setPendingAfterAuth(() => afterAuth);
    setShowAuth(true);
  }

  async function toggleLike(postId: string) {
    const wasLiked = likedIds.has(postId);
    const delta = wasLiked ? -1 : 1;

    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts((prev) => (prev ?? []).map((p) => (p.id === postId ? { ...p, like_count: p.like_count + delta } : p)));

    try {
      const res = await authFetch('/api/community/posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => (prev ?? []).map((p) => (p.id === postId ? { ...p, like_count: data.likeCount } : p)));
        return;
      }
    } catch {
      // sigue al revert de abajo
    }
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.add(postId) : next.delete(postId);
      return next;
    });
    setPosts((prev) => (prev ?? []).map((p) => (p.id === postId ? { ...p, like_count: p.like_count - delta } : p)));
  }

  async function toggleFollow(targetUserId: string) {
    const wasFollowing = followingIds.has(targetUserId);

    setFollowingIds((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.delete(targetUserId) : next.add(targetUserId);
      return next;
    });

    try {
      const res = await authFetch('/api/community/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) return;
    } catch {
      // sigue al revert de abajo
    }
    setFollowingIds((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.add(targetUserId) : next.delete(targetUserId);
      return next;
    });
  }

  async function deletePost(postId: string) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    const prevPosts = posts;
    setPosts((prev) => (prev ?? []).filter((p) => p.id !== postId));
    try {
      const res = await authFetch('/api/community/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) setPosts(prevPosts);
    } catch {
      setPosts(prevPosts);
    }
  }

  if (posts === null) {
    return <p className="text-sm text-neutral-500 text-center py-10">Cargando el feed...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-4 space-y-2">
        <textarea
          value={composerBody}
          onChange={(e) => setComposerBody(e.target.value.slice(0, POST_MAX_LENGTH))}
          placeholder={userId ? '¿Qué está pasando en el K-pop?' : 'Inicia sesión para publicar'}
          rows={3}
          className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-500">
            {composerBody.length}/{POST_MAX_LENGTH}
          </p>
          <button
            onClick={handlePublishClick}
            disabled={posting}
            className="bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {posting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden">
        {posts.length === 0 && (
          <p className="text-center text-neutral-500 py-10 text-sm">Sin publicaciones todavía — ¡sé el primero!</p>
        )}
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            userId={userId}
            liked={likedIds.has(post.id)}
            following={followingIds.has(post.user_id)}
            onToggleLike={toggleLike}
            onToggleFollow={toggleFollow}
            onDelete={deletePost}
            onRequestAuth={requestAuth}
          />
        ))}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            setPendingAfterAuth(null);
          }}
          onAuthed={() => {
            setShowAuth(false);
            pendingAfterAuth?.();
            setPendingAfterAuth(null);
          }}
        />
      )}
    </div>
  );
}
