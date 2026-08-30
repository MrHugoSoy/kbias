'use client';

import { useEffect, useState } from 'react';
import { validateBid, MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';
import { POINT_PACKAGES, formatPoints } from '@/lib/pointPackages';

export default function BidButton({
  groupId,
  groupName,
  compact,
}: {
  groupId: string;
  groupName: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [packageId, setPackageId] = useState(POINT_PACKAGES[0].id);
  const [name, setName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  async function handleSubmit() {
    setError('');

    const validationError = validateBid({ packageId, anonymous, socialUrl, message });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          packageId,
          supporterName: name,
          isAnonymous: anonymous,
          socialUrl: anonymous ? '' : socialUrl,
          message,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirige a Stripe Checkout
      } else {
        setError(data.error || 'Algo salió mal');
      }
    } catch (e) {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs px-2 py-1.5 rounded-lg transition'
            : 'bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-lg transition whitespace-nowrap'
        }
      >
        {compact ? (
          'Impulsar'
        ) : (
          <>
            <span className="sm:hidden">Impulsar</span>
            <span className="hidden sm:inline">Impulsa a {groupName}</span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">Impulsa a {groupName}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Cada impulso se suma al total de tu grupo. No hay un mínimo para "tomar la delantera" — entre más impulse tu
              comunidad, más arriba queda.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {POINT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageId(pkg.id)}
                  className={
                    'rounded-lg border-2 px-2 py-2 text-center transition ' +
                    (packageId === pkg.id
                      ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/40'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-pink-400')
                  }
                >
                  <p className="font-bold text-sm">${(pkg.priceCents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-pink-500 dark:text-pink-400">{formatPoints(pkg.points)} pts</p>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Tu nombre o el de tu fandom (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={anonymous}
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 disabled:opacity-50"
            />
            <input
              type="url"
              placeholder="Tu red social (opcional): https://instagram.com/tu_usuario"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              disabled={anonymous}
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 disabled:opacity-50"
            />
            <div>
              <textarea
                placeholder="Mensaje (opcional): ¡Fighting!"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                rows={2}
                className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 resize-none"
              />
              <p className="text-[10px] text-neutral-500 mt-1 text-right">
                {message.length}/{MESSAGE_MAX_LENGTH}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Impulsar de forma anónima
            </label>
            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Ir a pagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
