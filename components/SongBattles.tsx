'use client';

import { useEffect, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import AuthModal from './AuthModal';
import VoteMessageModal from './VoteMessageModal';

type Battle = {
  battle_id: string;
  ends_at: string;
  song_a_id: string;
  song_a_title: string;
  song_a_cover: string | null;
  song_a_group_name: string;
  song_a_group_image: string | null;
  song_a_points: number;
  song_b_id: string;
  song_b_title: string;
  song_b_cover: string | null;
  song_b_group_name: string;
  song_b_group_image: string | null;
  song_b_points: number;
};

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Terminada';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}

function SongSide({
  cover,
  groupImage,
  groupName,
  songTitle,
  onVote,
}: {
  cover: string | null;
  groupImage: string | null;
  groupName: string;
  songTitle: string;
  onVote: () => void;
}) {
  const img = cover ?? groupImage;
  return (
    <button onClick={onVote} className="flex-1 min-w-0 text-center group">
      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent group-hover:border-violet-400 transition">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={songTitle} className="w-full h-full object-cover" />
        )}
      </div>
      <p className="text-xs font-bold mt-1 truncate">{songTitle}</p>
      <p className="text-[10px] text-neutral-500 truncate">{groupName}</p>
    </button>
  );
}

// Batallas de canciones — se cargan a mano en la tabla `songs` (ver
// schema.sql); si no hay ninguna, esta sección simplemente no se muestra
// en vez de dejar un hueco vacío. El emparejamiento y la duración de cada
// batalla los maneja ensure_active_song_battles() en la base de datos.
export default function SongBattles() {
  const [battles, setBattles] = useState<Battle[] | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [voteTarget, setVoteTarget] = useState<{ battleId: string; songId: string; label: string } | null>(null);
  const [pointsRemaining, setPointsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<(() => void) | null>(null);

  async function loadBattles() {
    try {
      const res = await fetch('/api/song-battles');
      const data = await res.json();
      setBattles(data.battles ?? []);
    } catch {
      // Sondeo en segundo plano cada 60s — un fallo de red pasajero no debe
      // tumbar la página, simplemente se reintenta en el siguiente ciclo.
    }
  }

  useEffect(() => {
    loadBattles();
    // Refresca porcentajes y el "termina en" cada minuto — sin esto se
    // quedarían congelados hasta que alguien recargue la página.
    const id = setInterval(loadBattles, 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleVoteClick(battleId: string, songId: string, label: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPendingAfterAuth(() => () => handleVoteClick(battleId, songId, label));
      setShowAuth(true);
      return;
    }
    const res = await authFetch('/api/vote');
    if (!res.ok) {
      // Un 401 significa que la sesión guardada ya no es válida — no que ya
      // gastó sus puntos, así que hay que pedirle iniciar sesión de nuevo en
      // vez de abrir el modal con "0 puntos" (lo haría ver sin puntos falsamente).
      if (res.status === 401) {
        setPendingAfterAuth(() => () => handleVoteClick(battleId, songId, label));
        setShowAuth(true);
      }
      return;
    }
    const data2 = await res.json();
    setPointsRemaining(data2.pointsRemaining ?? 0);
    setVoteTarget({ battleId, songId, label });
  }

  async function confirmVote(message: string, points: number) {
    if (!voteTarget) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/song-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId: voteTarget.battleId, songId: voteTarget.songId, points, message: message || undefined }),
      });
      if (res.ok) {
        setVoteTarget(null);
        loadBattles();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!battles || battles.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-pink-500" /> Batallas de Canciones
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {battles.map((b) => {
          const total = b.song_a_points + b.song_b_points;
          const pctA = total > 0 ? Math.round((b.song_a_points / total) * 100) : 50;
          const pctB = 100 - pctA;
          return (
            <div key={b.battle_id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-pink-500 px-2 py-0.5 rounded-full">
                EN VIVO
              </span>
              <div className="flex items-center gap-2">
                <SongSide
                  cover={b.song_a_cover}
                  groupImage={b.song_a_group_image}
                  groupName={b.song_a_group_name}
                  songTitle={b.song_a_title}
                  onVote={() => handleVoteClick(b.battle_id, b.song_a_id, `${b.song_a_title} (${b.song_a_group_name})`)}
                />
                <span className="text-xs font-black text-neutral-400 shrink-0">VS</span>
                <SongSide
                  cover={b.song_b_cover}
                  groupImage={b.song_b_group_image}
                  groupName={b.song_b_group_name}
                  songTitle={b.song_b_title}
                  onVote={() => handleVoteClick(b.battle_id, b.song_b_id, `${b.song_b_title} (${b.song_b_group_name})`)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-violet-600 dark:text-violet-400">{pctA}%</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500" style={{ width: `${pctA}%` }} />
                </div>
                <span className="text-pink-500">{pctB}%</span>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-neutral-500">
                <Clock className="w-3 h-3" /> Termina en: {timeLeft(b.ends_at)}
              </p>
            </div>
          );
        })}
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
      {voteTarget && (
        <VoteMessageModal
          groupName={voteTarget.label}
          pointsRemaining={pointsRemaining}
          loading={loading}
          onClose={() => setVoteTarget(null)}
          onConfirm={confirmVote}
        />
      )}
    </section>
  );
}
