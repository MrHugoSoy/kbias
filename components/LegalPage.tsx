import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';

export function FooterLinks() {
  return (
    <div className="text-center text-xs text-neutral-600 pb-4">
      <Link href="/reglas" className="hover:text-pink-400">
        Reglas
      </Link>
      <span className="mx-2">·</span>
      <Link href="/terminos" className="hover:text-pink-400">
        Términos
      </Link>
      <span className="mx-2">·</span>
      <Link href="/privacidad" className="hover:text-pink-400">
        Privacidad
      </Link>
      <span className="mx-2">·</span>
      <Link href="/estadisticas" className="hover:text-pink-400">
        Estadísticas en vivo
      </Link>
    </div>
  );
}

export function LegalPage({
  title,
  subtitle,
  wide,
  children,
}: {
  title: string;
  subtitle: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const maxW = wide ? 'max-w-4xl' : 'max-w-2xl';
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-[#0a0a0c] dark:text-white transition-colors">
      <header className={`flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-900 ${maxW} mx-auto`}>
        <Crown className="w-6 h-6 text-pink-500 fill-pink-500/20" />
        <p className="font-extrabold tracking-tight">EL TRONO</p>
      </header>

      <div className={`${maxW} mx-auto px-4 py-10 space-y-8`}>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <h1 className="text-3xl font-black tracking-tight mt-3">{title}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
        </div>

        {children}

        <FooterLinks />
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400">{title}</h2>
      <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">{children}</div>
    </section>
  );
}
