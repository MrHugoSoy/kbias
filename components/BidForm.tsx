'use client';

import { useState } from 'react';
import { ChevronDown, Gavel, VenetianMask, Zap } from 'lucide-react';
import { validateBid, MESSAGE_MAX_LENGTH } from '@/lib/bidValidation';

type Group = { id: string; name: string; fandom_name: string | null };

export default function BidForm({ groups }: { groups: Group[] }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (!groupId) {
      setError('Elige un grupo');
      return;
    }
    const validationError = validateBid({ amountCents, anonymous, socialUrl, message });
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
          amountCents,
          supporterName: name,
          isAnonymous: anonymous,
          socialUrl: anonymous ? '' : socialUrl,
          message,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Algo salió mal');
      }
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-2 border-pink-700/60 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Gavel className="w-6 h-6 text-pink-500" />
        <div>
          <h2 className="font-bold">HAZ TU PUJA</h2>
          <p className="text-xs text-neutral-500">Apoya a tu grupo favorito — cada puja suma a su total</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Grupo</label>
          <div className="relative mt-1">
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full appearance-none bg-neutral-100 dark:bg-neutral-900 rounded-lg pl-3 pr-9 py-2"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.fandom_name ? `(${g.fandom_name})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Monto de tu puja (USD)</label>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-lg mt-1 px-3">
            <span className="text-neutral-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent px-2 py-2 outline-none"
            />
            <span className="text-neutral-500 text-xs">USD</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Tu nombre (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={anonymous}
            placeholder="Ej. Luna_92"
            className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Tu red social (opcional)</label>
          <input
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            disabled={anonymous}
            placeholder="https://instagram.com/tu_usuario"
            className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 disabled:opacity-50"
          />
          <p className="text-[10px] text-neutral-600 mt-1">Se muestra como link junto a tu nombre en el feed.</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500 uppercase tracking-wide">Mensaje (opcional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
          placeholder="Ej. ¡Fighting, siempre con ustedes!"
          rows={2}
          className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 resize-none"
        />
        <p className="text-[10px] text-neutral-600 mt-1 text-right">
          {message.length}/{MESSAGE_MAX_LENGTH}
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        Monto mínimo: <span className="text-amber-600 dark:text-amber-400 font-semibold">$1.00</span> — no hay tope para "tomar la delantera", cada donación cuenta.
      </p>

      <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Pujar de forma anónima <VenetianMask className="w-4 h-4" />
      </label>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setAmount('');
            setName('');
            setMessage('');
            setError('');
          }}
          className="flex-1 py-3 rounded-lg bg-neutral-200 dark:bg-neutral-800 font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold disabled:opacity-50"
        >
          {loading ? (
            'Procesando...'
          ) : (
            <span className="inline-flex items-center gap-1">
              Ir a pagar <Zap className="w-4 h-4 fill-current" />
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
