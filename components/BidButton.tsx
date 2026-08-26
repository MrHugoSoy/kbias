'use client';

import { useState } from 'react';

export default function BidButton({
  groupId,
  groupName,
  currentThroneCents,
}: {
  groupId: string;
  groupName: string;
  currentThroneCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minRequired = (currentThroneCents + 100) / 100; // trono actual + $1 mínimo

  async function handleSubmit() {
    setError('');
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (!amountCents || amountCents <= currentThroneCents) {
      setError(`Tu puja debe ser mayor a $${(currentThroneCents / 100).toFixed(2)}`);
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
        className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-lg transition"
      >
        Reclama este puesto para {groupName}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4">
            <h3 className="text-xl font-bold">Puja por {groupName}</h3>
            <p className="text-sm text-neutral-400">
              Mínimo para tomar el trono: ${minRequired.toFixed(2)}
            </p>
            <input
              type="number"
              placeholder="Monto en USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Tu nombre o el de tu fandom (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={anonymous}
              className="w-full bg-neutral-800 rounded-lg px-3 py-2 disabled:opacity-50"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Pujar de forma anónima
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg bg-neutral-700">
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
