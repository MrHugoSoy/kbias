'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import AuthModal from './AuthModal';
import VoteMessageModal from './VoteMessageModal';

export default function BidButton({
  groupId,
  groupName,
  compact,
  floatingMessage,
}: {
  groupId: string;
  groupName: string;
  compact?: boolean;
  // El mensaje de error/éxito flota sobre el layout en vez de reservar
  // espacio en el flujo normal — para usarlo en filas angostas donde el
  // texto (a veces largo, como "Ya repartiste tus 5 puntos de hoy...")
  // rompería la alineación con el resto de la fila al envolver en varias
  // líneas.
  floatingMessage?: boolean;
}) {
  const [showAuth, setShowAuth] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [pointsRemaining, setPointsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'ok' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  async function castVote(voteMessage: string, points: number) {
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, points, message: voteMessage || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult('ok');
        setMessage('¡Puntos entregados!');
        setShowMessageModal(false);
      } else {
        setResult('error');
        setMessage(data.error || 'Algo salió mal');
      }
    } catch {
      setResult('error');
      setMessage('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 4000);
    }
  }

  async function handleClick() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setShowAuth(true);
      return;
    }
    setChecking(true);
    try {
      const res = await authFetch('/api/vote');
      if (!res.ok) {
        // Un 401 significa que la sesión guardada ya no es válida (p. ej. se
        // cerró desde otro dispositivo) — no que ya gastó sus puntos, así
        // que hay que pedirle iniciar sesión de nuevo en vez de mostrar un
        // mensaje de "ya no te quedan puntos" que sería falso.
        if (res.status === 401) {
          setShowAuth(true);
          return;
        }
        setResult('error');
        setMessage('No pudimos verificar tus puntos. Intenta de nuevo.');
        setTimeout(() => setResult(null), 4000);
        return;
      }
      const data2 = await res.json();
      const remaining = data2.pointsRemaining ?? 0;
      if (remaining <= 0) {
        setResult('error');
        setMessage('Ya repartiste tus 5 puntos de hoy. Vuelve mañana.');
        setTimeout(() => setResult(null), 4000);
        return;
      }
      setPointsRemaining(remaining);
      setShowMessageModal(true);
    } catch {
      setResult('error');
      setMessage('Error de conexión, intenta de nuevo');
      setTimeout(() => setResult(null), 4000);
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {/* flex (no inline-flex) para que el ancho lo fije el contenedor, no el
          hijo más ancho — con inline-flex, el mensaje largo ensanchaba esta
          caja y el botón (alineado con items-end) se corría a la derecha
          para seguir pegado al nuevo borde. */}
      <div className={(compact ? 'w-full' : 'flex flex-col items-center') + (floatingMessage ? ' relative' : '') + ' gap-1'}>
        <button
          onClick={handleClick}
          disabled={loading || checking}
          className={
            (compact
              ? 'w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-xs px-2 py-1.5 rounded-lg transition'
              : 'bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg transition whitespace-nowrap') +
            ' disabled:opacity-50'
          }
        >
          {loading ? 'Votando...' : compact ? 'Votar' : (
            <>
              <span className="sm:hidden">Votar</span>
              <span className="hidden sm:inline">Vota por {groupName}</span>
            </>
          )}
        </button>
        {floatingMessage ? (
          // El mensaje flota sobre el layout (no reserva espacio) para que un
          // texto largo no empuje el resto de una fila angosta al envolver.
          result && (
            <p
              className={
                'absolute top-full right-0 mt-1 w-40 z-10 text-left text-[11px] leading-tight px-2 py-1 rounded-lg shadow-lg border ' +
                (result === 'ok'
                  ? 'text-green-600 dark:text-green-400 bg-white dark:bg-neutral-900 border-green-200 dark:border-green-900'
                  : 'text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 border-red-200 dark:border-red-900')
              }
            >
              {message}
            </p>
          )
        ) : (
          <p
            className={
              'text-[11px] min-h-[2.2em] leading-tight text-center ' +
              (result ? (result === 'ok' ? 'text-green-500' : 'text-red-500') : 'invisible')
            }
          >
            {message || ' '}
          </p>
        )}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={() => {
            setShowAuth(false);
            handleClick();
          }}
        />
      )}

      {showMessageModal && (
        <VoteMessageModal
          groupName={groupName}
          pointsRemaining={pointsRemaining}
          loading={loading}
          onClose={() => setShowMessageModal(false)}
          onConfirm={castVote}
        />
      )}
    </>
  );
}
