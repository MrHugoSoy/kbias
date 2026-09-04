'use client';

import { useEffect, useState } from 'react';

// HH:MM:SS en vivo contra una fecha de fin — se recalcula cada segundo, así
// el número nunca se queda pegado en el valor que trajo el servidor.
export function useCountdown(endsAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { hours, minutes, seconds, ended: ms <= 0 };
}
