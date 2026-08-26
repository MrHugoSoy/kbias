'use client';

import { useState } from 'react';

type Group = { id: string; name: string; fandom_name: string | null };

export default function BidForm({
  groups,
  currentThroneCents,
}: {
  groups: Group[];
  currentThroneCents: number;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minRequired = (currentThroneCents + 100) / 100;

  async function handleSubmit() {
    setError('');
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (!groupId) {
      setError('Elige un grupo');
      return;
    }
    if (!amountCents || amountCents <= currentThroneCents) {
      setError(`Tu puja debe ser mayor a $${(currentThroneCents / 100).toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, amountCents, supporterName: name, isAnonymous: anonymous }),
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
        <span className="text-2xl">🔨</span>
        <div>
          <h2 className="font-bold">HAZ TU PUJA</h2>
          <p className="text-xs text-neutral-500">Toma el trono para tu grupo favorito</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500 uppercase tracking-wide">Grupo</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full mt-1 bg-neutral-900 rounded-lg px-3 py-2"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} {g.fandom_name ? `(${g.fandom_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Monto de tu puja (USD)</label>
          <div className="flex items-center bg-neutral-900 rounded-lg mt-1 px-3">
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
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Tu nombre (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={anonymous}
            placeholder="Ej. Luna_92"
            className="w-full mt-1 bg-neutral-900 rounded-lg px-3 py-2 disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Mínimo para tomar el trono: <span className="text-amber-400 font-semibold">${minRequired.toFixed(2)}</span>
      </p>

      <label className="flex items-center gap-2 text-sm text-neutral-400">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Pujar de forma anónima 🎭
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setAmount('');
            setName('');
            setError('');
          }}
          className="flex-1 py-3 rounded-lg bg-neutral-800 font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Ir a pagar ⚡'}
        </button>
      </div>
    </section>
  );
}
