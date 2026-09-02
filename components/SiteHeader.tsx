import Link from 'next/link';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import MobileNavMenu from './MobileNavMenu';
import ProfileAvatarIcon from './ProfileAvatarIcon';
import LogoKW from './icons/LogoKW';

// Header compartido entre la portada y las páginas secundarias (via
// LegalPage) — antes esas páginas solo traían el logo, así que quien
// llegaba desde un link compartido se quedaba sin menú ni accesos rápidos
// a notificaciones/perfil/tema. Los anclas usan ruta absoluta ("/#ranking")
// para que funcionen igual ya sea que estés en la portada o llegando desde
// otra página.
export default function SiteHeader({
  home,
  maxWidthClassName = 'max-w-4xl xl:max-w-[75.5rem]',
}: {
  home?: boolean;
  maxWidthClassName?: string;
}) {
  return (
    <header
      className={`flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-900 ${maxWidthClassName} mx-auto`}
    >
      <Link href="/" className="flex items-center gap-2">
        <LogoKW className="w-10 h-10 text-pink-500" />
        <div>
          <h1 className="font-extrabold tracking-tight leading-none">K-POP WARS</h1>
          <p className="text-[10px] text-pink-400 tracking-widest">EL PODER ES DE LOS FANS</p>
        </div>
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          {home ? (
            <a href="#" className="text-pink-500 border-b-2 border-pink-500 pb-1">
              INICIO
            </a>
          ) : (
            <Link href="/">INICIO</Link>
          )}
          <a href="/#ranking">RANKING</a>
          <a href="/#como-funciona">CÓMO FUNCIONA</a>
          <Link href="/salon-de-la-fama">SALÓN DE LA FAMA</Link>
          <a href="/#faq">FAQ</a>
          <Link href="/perfil" title="Mi perfil" className="flex items-center">
            <ProfileAvatarIcon size={26} />
          </Link>
        </nav>
        <NotificationBell />
        <ThemeToggle />
        <MobileNavMenu />
      </div>
    </header>
  );
}
