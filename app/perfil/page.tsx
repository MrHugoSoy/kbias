'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Mic2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { LegalPage } from '@/components/LegalPage';
import AuthModal from '@/components/AuthModal';
import PixelAvatar from '@/components/PixelAvatar';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
        supabase.from('profiles').select('username').eq('id', user!.id).maybeSingle(),
      ]);
      setVotes(voteRows ?? []);
      setGroups(groupRows ?? []);
      setUsername(profileRow?.username ?? null);
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
          <PixelAvatar seed={user.id} size={44} />
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

        {loadingData ? (
          <p className="text-sm text-neutral-500">Cargando...</p>
        ) : tallies.length === 0 ? (
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
