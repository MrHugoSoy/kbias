'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Mic2, Pencil, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { LegalPage } from '@/components/LegalPage';
import AuthModal from '@/components/AuthModal';
import PixelAvatar, { SPECIES } from '@/components/PixelAvatar';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

type Group = { id: string; name: string; fandom_name: string | null; image_url: string | null };
type VoteRow = { group_id: string; created_at: string };

type GroupTally = { group: Group; count: number };

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoadingData(true);
      const [{ data: voteRows }, { data: groupRows }, { data: profileRow }] = await Promise.all([
        supabase.from('votes').select('group_id, created_at').eq('user_id', user!.id),
        supabase.from('groups').select('id, name, fandom_name, image_url'),
        supabase.from('profiles').select('username, avatar_species, avatar_url').eq('id', user!.id).maybeSingle(),
      ]);
      setVotes(voteRows ?? []);
      setGroups(groupRows ?? []);
      setUsername(profileRow?.username ?? null);
      setAvatarSpecies(profileRow?.avatar_species ?? null);
      setAvatarUrl(profileRow?.avatar_url ?? null);
      setLoadingData(false);
    }
    loadData();
  }, [user]);

  async function signOut() {
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
    setShowAvatarPicker(false);
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
      setShowAvatarPicker(false);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!authLoaded) {
    return (
      <LegalPage title="Mi perfil" subtitle="Cargando...">
        <div />
      </LegalPage>
    );
  }

  if (!user) {
    return (
      <LegalPage title="Mi perfil" subtitle="Inicia sesión para ver tu historial de votos.">
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
      <LegalPage title="Mi perfil" subtitle="Cargando...">
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-3 w-36 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
        </div>

        <div className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />

        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        </div>
      </LegalPage>
    );
  }

  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const votedToday = votes.find((v) => new Date(v.created_at) >= startOfDayUtc);
  const votedTodayGroup = votedToday ? groups.find((g) => g.id === votedToday.group_id) : null;

  const tallies: GroupTally[] = groups
    .map((group) => ({ group, count: votes.filter((v) => v.group_id === group.id).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const memberSince = new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <LegalPage title="Mi perfil" subtitle={`Miembro desde ${memberSince}.`}>
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-xl p-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setShowAvatarPicker((v) => !v)}
            className="relative group shrink-0"
            title="Cambiar avatar"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Tu avatar" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <PixelAvatar seed={user.id} species={avatarSpecies} size={44} />
            )}
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </span>
          </button>
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
                    className="text-xs bg-pink-600 hover:bg-pink-500 text-white rounded-md px-2 py-1 disabled:opacity-50"
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
                className="flex items-center gap-1.5 text-sm font-semibold hover:text-pink-500"
              >
                {username ? `@${username}` : 'Elige un nombre de usuario'}
                <Pencil className="w-3 h-3 text-neutral-400" />
              </button>
            )}
            <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
        </button>
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
                  (avatarSpecies === s.key && !avatarUrl ? 'ring-pink-500' : 'ring-transparent hover:ring-pink-300')
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
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50"
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

      <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl p-4">
        {votedTodayGroup ? (
          <p className="text-sm text-pink-700 dark:text-pink-300">
            ✓ Hoy votaste por <strong>{votedTodayGroup.name}</strong>. Vuelve mañana para votar de nuevo.
          </p>
        ) : (
          <p className="text-sm text-pink-700 dark:text-pink-300">
            Todavía no has votado hoy —{' '}
            <a href="/#ranking" className="underline font-semibold">
              ve al ranking y vota
            </a>
            .
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400">
          Tu historial de votos {votes.length > 0 && `(${votes.length} en total)`}
        </h2>

        {tallies.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no has votado por ningún grupo.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden">
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
                  <p className="text-xs text-pink-400 truncate">{group.fandom_name}</p>
                </div>
                <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0">
                  {count} {count === 1 ? 'voto' : 'votos'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </LegalPage>
  );
}
