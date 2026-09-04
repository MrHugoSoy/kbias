import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import TikTokIcon from '@/components/icons/TikTokIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import SiteHeader from '@/components/SiteHeader';
import { CONTACT_EMAIL } from '@/lib/contact';

// Agrega aquí cada nueva red social conforme se sumen
const SOCIAL_LINKS = [
  { name: 'TikTok', url: 'https://www.tiktok.com/@thekpopwars', Icon: TikTokIcon },
  { name: 'Instagram', url: 'https://www.instagram.com/thekpopwars', Icon: InstagramIcon },
];

export function FooterLinks() {
  return (
    <div className="text-center text-xs text-neutral-600 pb-4 space-y-3">
      <div className="flex items-center justify-center gap-4">
        {SOCIAL_LINKS.map(({ name, url, Icon }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className="text-neutral-500 hover:text-pink-400 transition"
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
        <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Correo" className="text-neutral-500 hover:text-pink-400 transition">
          <Mail className="w-5 h-5" />
        </a>
      </div>
      <div>
        <Link href="/sobre-nosotros" className="hover:text-pink-400">
          Sobre nosotros
        </Link>
        <span className="mx-2">·</span>
        <Link href="/como-funciona" className="hover:text-pink-400">
          Cómo funciona
        </Link>
        <span className="mx-2">·</span>
        <Link href="/como-funciona#faq" className="hover:text-pink-400">
          FAQ
        </Link>
        <span className="mx-2">·</span>
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
          Ranking Global
        </Link>
        <span className="mx-2">·</span>
        <Link href="/salon-de-la-fama" className="hover:text-pink-400">
          Salón de la Fama
        </Link>
      </div>
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
  const maxW = wide ? 'max-w-4xl xl:max-w-[75.5rem]' : 'max-w-2xl';
  return (
    <main className="min-h-screen bg-[#f5f8fc] text-neutral-900 dark:bg-[#0a0a0c] dark:text-white transition-colors">
      {/* El header siempre usa su ancho por defecto (el mismo de la portada),
          sin importar qué tan angosta sea la columna de contenido de esta
          página — con max-w-2xl (Reglas, Perfil, etc.) el menú completo no
          cabía en una sola línea y se rompía en varios renglones. */}
      <SiteHeader />

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
