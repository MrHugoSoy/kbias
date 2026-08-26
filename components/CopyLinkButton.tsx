'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

export default function CopyLinkButton({ slug, label = 'Copiar link' }: { slug: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const url = `${window.location.origin}/grupo/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin acceso al portapapeles (permiso denegado, etc.) — falla en silencio.
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? '¡Copiado!' : label}
    </button>
  );
}
