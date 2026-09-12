'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import AuthModal from './AuthModal';
import { PostItem } from './CommunityPostItem';
import { notifyFollowsChanged } from '@/lib/followEvents';
import type { CommunityPost } from '@/lib/types';

const POST_MAX_LENGTH = 280;

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

  // Publicaciones de otros fans en vivo, sin recargar — igual que
  // "Actividad en vivo" del ranking. El evento de Realtime solo trae la fila
  // cruda de community_posts (sin username/avatar/xp), así que se completa
  // con una consulta a `profiles` antes de meterla al feed.
  useEffect(() => {
    const channel = supabase
      .channel('community-posts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        async (payload) => {
          const row = payload.new as { id: string; body: string; created_at: string; user_id: string };
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_species, avatar_url, xp')
            .eq('id', row.user_id)
            .maybeSingle();
          const newPost: CommunityPost = {
            id: row.id,
            body: row.body,
            created_at: row.created_at,
            user_id: row.user_id,
            username: profile?.username ?? null,
            avatar_species: profile?.avatar_species ?? null,
            avatar_url: profile?.avatar_url ?? null,
            xp: profile?.xp ?? 0,
            like_count: 0,
            comment_count: 0,
          };
          setPosts((prev) => (prev?.some((p) => p.id === newPost.id) ? prev : [newPost, ...(prev ?? [])]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      if (res.ok) {
        notifyFollowsChanged();
        return;
      }
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
