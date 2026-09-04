import Link from 'next/link';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import MobileNavMenu from './MobileNavMenu';
import ProfileAvatarIcon from './ProfileAvatarIcon';
import HeaderAuthButton from './HeaderAuthButton';
import LogoKW from './icons/LogoKW';

// Header compartido entre la portada y las páginas secundarias (via
// LegalPage) — antes esas páginas solo traían el logo, así que quien
// llegaba desde un link compartido se quedaba sin menú ni accesos rápidos
// a notificaciones/perfil/tema. Los anclas usan ruta absoluta ("/#ranking")
// para que funcionen igual ya sea que estés en la portada o llegando desde
// otra página. El logo ya lleva a "/", así que no hay un link "INICIO" aparte.
export default function SiteHeader() {
  return (
    // El borde (y el fondo, si el header alguna vez lo lleva) llega de lado
    // a lado de la pantalla — solo el contenido de adentro se mantiene en
    // la misma columna que el resto del sitio.
    <header className="border-b border-neutral-200 dark:border-neutral-900">
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl xl:max-w-[75.5rem] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <LogoKW className="w-9 h-9 text-violet-600 dark:text-violet-400" />
          <span className="font-black tracking-tight text-lg leading-none">
            K-POP{' '}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">WARS</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            <a href="/#ranking" className="hover:text-violet-600 dark:hover:text-violet-400 transition">
              RANKING
            </a>
            <Link href="/batallas" className="hover:text-violet-600 dark:hover:text-violet-400 transition">
              BATALLAS
            </Link>
            <Link href="/grupos" className="hover:text-violet-600 dark:hover:text-violet-400 transition">
              GRUPOS
            </Link>
            <Link href="/noticias" className="hover:text-violet-600 dark:hover:text-violet-400 transition">
              NOTICIAS
            </Link>
            <Link href="/salon-de-la-fama" className="hover:text-violet-600 dark:hover:text-violet-400 transition">
              SALÓN DE LA FAMA
            </Link>
            <Link href="/perfil" title="Mi perfil" className="flex items-center">
              <ProfileAvatarIcon size={26} />
            </Link>
          </nav>
          <HeaderAuthButton />
          <NotificationBell />
          <ThemeToggle />
          <MobileNavMenu />
        </div>
      </div>
    </header>
  );
}
