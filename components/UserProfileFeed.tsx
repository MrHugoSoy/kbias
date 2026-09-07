'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { levelForXp, xpForLevel } from '@/lib/level';
import { notifyFollowsChanged } from '@/lib/followEvents';
import UserAvatar from './UserAvatar';
import AuthModal from './AuthModal';
import { PostItem } from './CommunityPostItem';
import type { CommunityPost } from '@/lib/types';

type Profile = {
  avatarUrl: string | null;
  avatarSpecies: string | null;
  xp: number;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
};

// Perfil público de un usuario de la Comunidad (/usuario/[username]):
// tarjeta con su avatar/nivel/contadores reales + botón de seguir, y sus
// publicaciones — reusa el mismo PostItem del feed general para no
// duplicar la lógica de like/comentar.
export default function UserProfileFeed({ userId, username }: { userId: string; username: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<(() => void) | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setViewerId(data.session?.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setViewerId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile() {
    const [{ data: row }, { count: postCount }, { count: followerCount }, { count: followingCount }] =
      await Promise.all([
        supabase.from('profiles').select('avatar_url, avatar_species, xp, created_at').eq('id', userId).maybeSingle(),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('followee_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
    setProfile({
      avatarUrl: row?.avatar_url ?? null,
      avatarSpecies: row?.avatar_species ?? null,
      xp: row?.xp ?? 0,
      createdAt: row?.created_at ?? new Date().toISOString(),
      postCount: postCount ?? 0,
      followerCount: followerCount ?? 0,
      followingCount: followingCount ?? 0,
    });
  }

  useEffect(() => {
    loadProfile();
    supabase
      .from('community_feed')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => setPosts(data ?? []));
  }, [userId]);

  useEffect(() => {
    if (!viewerId) {
      setFollowing(false);
      setLikedIds(new Set());
      setFollowingIds(new Set());
      return;
    }
    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', viewerId)
      .eq('followee_id', userId)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
    authFetch('/api/community/posts/likes')
      .then((res) => res.json())
      .then((data) => setLikedIds(new Set<string>(data.likedPostIds ?? [])));
    supabase
      .from('user_follows')
      .select('followee_id')
      .eq('follower_id', viewerId)
      .then(({ data }) => setFollowingIds(new Set<string>((data ?? []).map((row) => row.followee_id))));
  }, [viewerId, userId]);

  function requestAuth(afterAuth: () => void) {
    setPendingAfterAuth(() => afterAuth);
    setShowAuth(true);
  }

  async function toggleFollowTarget(targetUserId: string) {
    const isSelf = targetUserId === userId;
    const wasFollowing = isSelf ? following : followingIds.has(targetUserId);

    if (isSelf) {
      setFollowing(!wasFollowing);
      setFollowLoading(true);
    } else {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        wasFollowing ? next.delete(targetUserId) : next.add(targetUserId);
        return next;
      });
    }

    try {
      const res = await authFetch('/api/community/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        notifyFollowsChanged();
        if (isSelf) loadProfile();
        return;
      }
    } catch {
      // sigue al revert de abajo
    } finally {
      if (isSelf) setFollowLoading(false);
    }
    if (isSelf) {
      setFollowing(wasFollowing);
    } else {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        wasFollowing ? next.add(targetUserId) : next.delete(targetUserId);
        return next;
      });
    }
  }

  function handleFollowClick() {
    if (!viewerId) {
      requestAuth(() => toggleFollowTarget(userId));
      return;
    }
    toggleFollowTarget(userId);
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

  if (!profile || posts === null) {
    return <p className="text-sm text-neutral-500 text-center py-10">Cargando perfil...</p>;
  }

  const level = levelForXp(profile.xp);
  const memberSinceYear = new Date(profile.createdAt).getFullYear();
  const isSelf = viewerId === userId;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar avatarUrl={profile.avatarUrl} seed={userId} species={profile.avatarSpecies} size={64} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">@{username}</p>
            <p className="text-xs text-neutral-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Desde {memberSinceYear} · Nivel {level}
            </p>
          </div>
          {!isSelf && (
            <button
              onClick={handleFollowClick}
              disabled={followLoading}
              className={
                'shrink-0 text-sm font-bold flex items-center gap-1.5 px-4 py-2 rounded-full transition disabled:opacity-50 ' +
                (following
                  ? 'text-neutral-500 bg-neutral-100 dark:bg-neutral-900 hover:text-red-500'
                  : 'text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90')
              }
            >
              {following ? (
                <>
                  <UserCheck className="w-4 h-4" /> Siguiendo
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Seguir
                </>
              )}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 text-center">
            <p className="text-sm font-black">{profile.postCount.toLocaleString('es-MX')}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Posts</p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 text-center">
            <p className="text-sm font-black">{profile.followerCount.toLocaleString('es-MX')}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Seguidores</p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 text-center">
            <p className="text-sm font-black">{profile.followingCount.toLocaleString('es-MX')}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Siguiendo</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-2xl overflow-hidden">
        {posts.length === 0 && (
          <p className="text-center text-neutral-500 py-10 text-sm">@{username} todavía no ha publicado nada.</p>
        )}
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            userId={viewerId}
            liked={likedIds.has(post.id)}
            following={followingIds.has(post.user_id)}
            onToggleLike={toggleLike}
            onToggleFollow={toggleFollowTarget}
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
