'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 hover:opacity-80 transition"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
