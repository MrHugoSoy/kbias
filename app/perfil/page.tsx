'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Flame, ImagePlus, Lock, LogOut, Mic2, Newspaper, Pencil, Swords, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { LegalPage } from '@/components/LegalPage';
import AuthModal from '@/components/AuthModal';
import PixelAvatar, { SPECIES } from '@/components/PixelAvatar';
import LevelBadge from '@/components/LevelBadge';
import Sparkline from '@/components/Sparkline';
import { levelForXp, xpForLevel } from '@/lib/level';
import { hasPerk, PERK_LEVELS } from '@/lib/perks';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const SPARKLINE_DAYS = 14;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const DAILY_POINT_BUDGET = 5;

type Group = { id: string; name: string; fandom_name: string | null; image_url: string | null };
type VoteRow = { group_id: string; created_at: string; points: number };

type GroupTally = { group: Group; count: number };

type ProfileCache = {
  userId: string;
  votes: VoteRow[];
  groups: Group[];
  username: string | null;
  avatarSpecies: string | null;
  avatarUrl: string | null;
  xp: number;
  bannerUrl: string | null;
  currentStreak: number;
};

function StatBlock({ label, value, data }: { label: string; value: string; data?: number[] }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{value}</p>
      {data && <Sparkline data={data} />}
    </div>
  );
}

// Vive fuera del componente a propósito: sobrevive a que el usuario salga
// de /perfil y regrese (client-side navigation), así no se repite el
// parpadeo de carga cada vez — solo se refresca en segundo plano.
let profileCache: ProfileCache | null = null;

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [avatarSpecies, setAvatarSpecies] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [marketingError, setMarketingError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Solo se usa para el temporizador de "vuelve en Xh Ym Zs" — se actualiza
  // cada segundo mientras la pestaña está abierta en /perfil.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setMarketingOptIn(!!data.session?.user?.user_metadata?.marketing_opt_in);
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setMarketingOptIn(!!session?.user?.user_metadata?.marketing_opt_in);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Solo decide si se muestra el link al panel de admin — el acceso real se
  // valida server-side en /api/admin/* contra ADMIN_EMAILS, esto nunca es la
  // única puerta.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    authFetch('/api/admin/whoami')
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [user]);

  async function toggleMarketing(next: boolean) {
    setMarketingError('');
    setSavingMarketing(true);
    try {
      const payload = { marketing_opt_in: next, marketing_opt_in_at: next ? new Date().toISOString() : null };
      let { data, error } = await supabase.auth.updateUser({ data: payload });
      if (error) {
        // Si la sesión quedó desincronizada (ver nota en ActivityFeed sobre
        // múltiples GoTrueClient), un refresh y un solo reintento resuelve
        // la mayoría de los casos sin que el usuario tenga que volver a
        // iniciar sesión.
        await supabase.auth.refreshSession();
        ({ data, error } = await supabase.auth.updateUser({ data: payload }));
      }
      if (error || !data.user) {
        setMarketingError('No se pudo guardar. Cierra sesión y vuelve a entrar, luego intenta de nuevo.');
        return;
      }
      setUser(data.user);
      setMarketingOptIn(next);
    } finally {
      setSavingMarketing(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    // Si ya visitamos el perfil de este mismo usuario en esta sesión,
    // pinta esos datos de inmediato (sin parpadeo) y refresca en silencio.
    const cached = profileCache?.userId === user.id ? profileCache : null;
    if (cached) {
      setVotes(cached.votes);
      setGroups(cached.groups);
      setUsername(cached.username);
      setAvatarSpecies(cached.avatarSpecies);
      setAvatarUrl(cached.avatarUrl);
      setXp(cached.xp);
      setBannerUrl(cached.bannerUrl);
      setCurrentStreak(cached.currentStreak);
      setLoadingData(false);
    }

    async function loadData() {
      if (!cached) setLoadingData(true);
      const [{ data: voteRows }, { data: groupRows }, { data: profileRow }] = await Promise.all([
        supabase.from('votes').select('group_id, created_at, points').eq('user_id', user!.id),
        supabase.from('groups').select('id, name, fandom_name, image_url'),
        supabase.from('profiles').select('username, avatar_species, avatar_url, xp, banner_url, current_streak').eq('id', user!.id).maybeSingle(),
      ]);
      const next: ProfileCache = {
        userId: user!.id,
        votes: voteRows ?? [],
        groups: groupRows ?? [],
        username: profileRow?.username ?? null,
        avatarSpecies: profileRow?.avatar_species ?? null,
        avatarUrl: profileRow?.avatar_url ?? null,
        xp: profileRow?.xp ?? 0,
        bannerUrl: profileRow?.banner_url ?? null,
        currentStreak: profileRow?.current_streak ?? 0,
      };
      profileCache = next;
      setVotes(next.votes);
      setGroups(next.groups);
      setUsername(next.username);
      setAvatarSpecies(next.avatarSpecies);
      setAvatarUrl(next.avatarUrl);
      setXp(next.xp);
      setBannerUrl(next.bannerUrl);
      setCurrentStreak(next.currentStreak);
      setLoadingData(false);

      // Sincroniza el avatar en el user_metadata de la sesión: así el
      // icono de perfil en el header (ProfileAvatarIcon) lo lee al instante
      // desde la sesión guardada en localStorage sin esperar una consulta a
      // `profiles`, evitando el parpadeo animalito -> foto real al recargar.
      const meta = user!.user_metadata ?? {};
      if (meta.avatar_species !== next.avatarSpecies || meta.avatar_url !== next.avatarUrl) {
        supabase.auth.updateUser({ data: { avatar_species: next.avatarSpecies, avatar_url: next.avatarUrl } });
      }
    }
    loadData();
  }, [user]);

  function patchCache(partial: Partial<Omit<ProfileCache, 'userId'>>) {
    if (profileCache) profileCache = { ...profileCache, ...partial };
  }

  async function signOut() {
    profileCache = null;
    await supabase.auth.signOut();
    router.replace('/');
  }

  async function saveUsername() {
    setUsernameError('');
    setSavingUsername(true);
    try {
      const res = await authFetch('/api/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error || 'Algo salió mal');
        return;
      }
      setUsername(data.username);
      patchCache({ username: data.username });
      setEditingUsername(false);
    } catch {
      setUsernameError('Error de conexión, intenta de nuevo');
    } finally {
      setSavingUsername(false);
    }
  }

  async function chooseSpecies(key: string) {
    setAvatarError('');
    const res = await authFetch('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ species: key }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAvatarError(data.error || 'Algo salió mal');
      return;
    }
    setAvatarSpecies(key);
    setAvatarUrl(null);
    patchCache({ avatarSpecies: key, avatarUrl: null });
    setShowAvatarPicker(false);
    supabase.auth.updateUser({ data: { avatar_species: key, avatar_url: null } });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setAvatarError('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Solo se aceptan JPG, PNG o WEBP');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setAvatarError('La foto no puede superar 2MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      // Nombre único por subida (no fijo) para evitar que el cache del CDN
      // siga sirviendo la foto vieja bajo la misma URL.
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const res = await authFetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAvatarUrl(publicUrl);
      setAvatarSpecies(null);
      patchCache({ avatarUrl: publicUrl, avatarSpecies: null });
      setShowAvatarPicker(false);
      supabase.auth.updateUser({ data: { avatar_species: null, avatar_url: publicUrl } });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setBannerError('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setBannerError('Solo se aceptan JPG, PNG o WEBP');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setBannerError('La imagen no puede superar 2MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const res = await authFetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: publicUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBannerUrl(publicUrl);
      patchCache({ bannerUrl: publicUrl });
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploadingBanner(false);
    }
  }

  async function removeBanner() {
    setBannerError('');
    try {
      const res = await authFetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBannerUrl(null);
      patchCache({ bannerUrl: null });
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Error al quitar el banner');
    }
  }

  if (!authLoaded) {
    return (
      <LegalPage title="Mi perfil" subtitle="Cargando..." wide>
        <div />
      </LegalPage>
    );
  }

  if (!user) {
    return (
      <LegalPage title="Mi perfil" subtitle="Inicia sesión para ver tu historial de votos." wide>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-5 py-2.5 rounded-lg transition"
        >
          Iniciar sesión
        </button>
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />
        )}
      </LegalPage>
    );
  }

  if (loadingData) {
    return (
      <LegalPage title="Mi perfil" subtitle="Cargando..." wide>
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="h-36 sm:h-52 bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            <div className="absolute -bottom-8 left-4 sm:left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>

          <div className="pt-9 flex items-start justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              <div className="h-3.5 w-48 rounded bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            </div>
            <div className="h-9 w-28 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>

          <div className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          <div className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />

          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        </div>
      </LegalPage>
    );
  }

  const utcDayStart = new Date();
  utcDayStart.setUTCHours(0, 0, 0, 0);
  const pointsUsedToday = votes
    .filter((v) => new Date(v.created_at) >= utcDayStart)
    .reduce((sum, v) => sum + v.points, 0);
  const pointsRemainingToday = Math.max(0, DAILY_POINT_BUDGET - pointsUsedToday);

  // Cuenta regresiva hasta la medianoche UTC, cuando se recargan los 5
  // puntos — solo importa mostrarla cuando ya no quedan puntos hoy.
  const nextResetAt = new Date(utcDayStart.getTime() + 24 * 60 * 60 * 1000);
  const msUntilReset = Math.max(0, nextResetAt.getTime() - now);
  const hoursLeft = Math.floor(msUntilReset / 3_600_000);
  const minutesLeft = Math.floor((msUntilReset % 3_600_000) / 60_000);
  const secondsLeft = Math.floor((msUntilReset % 60_000) / 1000);
  const resetCountdown = `${hoursLeft}h ${String(minutesLeft).padStart(2, '0')}m ${String(secondsLeft).padStart(2, '0')}s`;

  const level = levelForXp(xp);
  const xpIntoLevel = xp - xpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1) - xpForLevel(level);
  const levelProgressPct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  const tallies: GroupTally[] = groups
    .map((group) => ({ group, count: votes.filter((v) => v.group_id === group.id).reduce((sum, v) => sum + v.points, 0) }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const totalPointsGiven = votes.reduce((sum, v) => sum + v.points, 0);

  // Serie diaria para la mini-gráfica de la pestaña Estadísticas — se
  // calcula acá en vez de con una consulta aparte porque `votes` ya trae
  // todo el historial del usuario.
  const dailySeries = Array.from({ length: SPARKLINE_DAYS }, (_, i) => {
    const dayStart = new Date(utcDayStart.getTime() - (SPARKLINE_DAYS - 1 - i) * 86_400_000);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    return votes
      .filter((v) => {
        const t = new Date(v.created_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      })
      .reduce((sum, v) => sum + v.points, 0);
  });

  const memberSince = new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const bannerUnlocked = hasPerk(level, 'profileBanner');

  return (
    <LegalPage title="Mi perfil" subtitle={`Miembro desde ${memberSince}.`} wide>
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-36 sm:h-52 bg-neutral-100 dark:bg-neutral-900">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Banner de tu perfil" className="w-full h-full object-cover" />
            ) : bannerUnlocked ? (
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="w-full h-full flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-violet-500 dark:hover:text-violet-400 transition disabled:opacity-50"
              >
                <ImagePlus className="w-5 h-5" /> {uploadingBanner ? 'Subiendo...' : 'Agregar banner de perfil'}
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center gap-2 text-sm text-neutral-400 dark:text-neutral-600">
                <Lock className="w-4 h-4" /> Desbloqueas un banner de perfil en el nivel {PERK_LEVELS.profileBanner}
              </div>
            )}
            {bannerUrl && (
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition disabled:opacity-50"
                  title="Cambiar banner"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={removeBanner}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition"
                  title="Quitar banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>
          <button
            onClick={() => setShowAvatarPicker((v) => !v)}
            className="absolute -bottom-8 left-4 sm:left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-neutral-950 overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 group"
            title="Cambiar avatar"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Tu avatar" className="w-full h-full object-cover" />
            ) : (
              <PixelAvatar seed={user.id} species={avatarSpecies} size={96} />
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Pencil className="w-5 h-5 text-white" />
            </span>
          </button>
        </div>
        {bannerError && <p className="text-xs text-red-500">{bannerError}</p>}

        <div className="pt-9 flex items-start justify-between flex-wrap gap-3">
          <div className="min-w-0">
            {editingUsername ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-neutral-500">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20))}
                    onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
                    placeholder="tunombre"
                    autoFocus
                    className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-sm w-32"
                  />
                  <button
                    onClick={saveUsername}
                    disabled={savingUsername || usernameInput.length < 3}
                    className="text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-md px-2 py-1 disabled:opacity-50"
                  >
                    {savingUsername ? '...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setUsernameError(''); }}
                    className="text-xs text-neutral-500 px-1"
                  >
                    Cancelar
                  </button>
                </div>
                {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
                <p className="text-[10px] text-neutral-500">3-20 caracteres: letras, números, _ y -</p>
              </div>
            ) : (
              <button
                onClick={() => { setUsernameInput(username ?? ''); setEditingUsername(true); }}
                className="flex items-center gap-1.5 text-xl font-black tracking-tight hover:text-violet-500"
              >
                {username ? `@${username}` : 'Elige un nombre de usuario'}
                <LevelBadge xp={xp} />
                <Pencil className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}
            <p className="text-sm text-neutral-500 truncate mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {tallies[0] && (
                <span className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  ♥ {tallies[0].group.fandom_name ?? tallies[0].group.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 text-xs font-medium px-2.5 py-1 rounded-full">
                <Calendar className="w-3 h-3" /> Desde {new Date(user.created_at).getFullYear()}
              </span>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <Link
                  href="/admin/noticias"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <Newspaper className="w-3.5 h-3.5" /> Noticias
                </Link>
                <Link
                  href="/admin/batallas"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <Swords className="w-3.5 h-3.5" /> Batallas
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>

        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400">Nivel {level}</p>
            <p className="text-xs text-neutral-500">
              {xp} XP · faltan {xpForNextLevel - xpIntoLevel} para el nivel {level + 1}
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all" style={{ width: `${levelProgressPct}%` }} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Puntos dados" value={totalPointsGiven.toLocaleString('es-MX')} data={dailySeries} />
          <StatBlock label="Puntos hoy" value={pointsUsedToday.toLocaleString('es-MX')} />
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-2">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Racha</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono flex items-center gap-1.5">
              {currentStreak > 0 && <Flame className="w-5 h-5 text-amber-500" />}
              {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
            </p>
          </div>
        </div>

        {showAvatarPicker && (
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Elige un animalito</p>
            <div className="flex flex-wrap gap-2">
              {SPECIES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => chooseSpecies(s.key)}
                  className={
                    'rounded-full transition ring-2 ' +
                    (avatarSpecies === s.key && !avatarUrl ? 'ring-violet-500' : 'ring-transparent hover:ring-violet-300')
                  }
                  title={s.name}
                >
                  <PixelAvatar seed={user.id} species={s.key} size={48} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" /> {uploadingPhoto ? 'Subiendo...' : 'Subir tu propia foto'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-neutral-500">JPG, PNG o WEBP · máx. 2MB</p>
            {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/60 rounded-xl p-4">
            {pointsRemainingToday > 0 ? (
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Te quedan <strong>{pointsRemainingToday} de {DAILY_POINT_BUDGET}</strong> puntos hoy —{' '}
                <a href="/#ranking" className="underline font-semibold">
                  repártelos en el ranking
                </a>
                .
              </p>
            ) : (
              <p className="text-sm text-violet-700 dark:text-violet-300">
                ✓ Ya repartiste tus {DAILY_POINT_BUDGET} puntos de hoy. Vuelve en{' '}
                <strong className="font-mono" suppressHydrationWarning>{resetCountdown}</strong>.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-violet-600 dark:text-violet-400">Tus puntos por grupo</h2>

            {tallies.length === 0 ? (
              <p className="text-sm text-neutral-500">Todavía no has votado por ningún grupo.</p>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 shadow-sm dark:ring-1 dark:ring-white/10 rounded-xl overflow-hidden">
                {tallies.map(({ group, count }) => (
                  <div key={group.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                      {group.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <Mic2 className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{group.name}</p>
                      <p className="text-xs text-violet-400 truncate">{group.fandom_name}</p>
                    </div>
                    <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0">
                      {count} {count === 1 ? 'punto' : 'puntos'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={marketingOptIn}
              disabled={savingMarketing}
              onChange={(e) => toggleMarketing(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <div>
              <p className="text-sm font-semibold">Correos de novedades</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Novedades, nuevos rankings y promociones de nuestros socios. Opcional — puedes cambiarlo cuando quieras.
              </p>
              {marketingError && <p className="text-xs text-red-500 mt-1">{marketingError}</p>}
            </div>
          </div>
        </div>
      </div>
    </LegalPage>
  );
}
