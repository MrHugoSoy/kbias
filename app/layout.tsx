import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';
import './globals.css';

const title = 'K-pop Wars — Ranking K-pop';
const description =
  'El grupo de K-pop con más votos se queda con el puesto #1. Vota gratis, una vez al día — sin ciclos, sin reset. El poder es de los fans.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s — K-pop Wars' },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'K-pop Wars',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

// Datos estructurados (schema.org) para que buscadores entiendan qué es
// el sitio — no cambia nada visible, ayuda a cómo Google interpreta la
// página en resultados de búsqueda.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'K-pop Wars',
  url: siteUrl,
  description,
  inLanguage: 'es',
  sameAs: ['https://www.tiktok.com/@thekpopwars', 'https://www.instagram.com/thekpopwars'],
};

// Se ejecuta antes de pintar la página para evitar el flash del tema equivocado.
// Por defecto queda oscuro (el look original) a menos que el usuario ya haya
// elegido "light" explícitamente.
const themeInitScript = `
(function () {
  try {
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
