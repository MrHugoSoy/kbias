import './globals.css';

export const metadata = {
  title: 'El Trono — Ranking K-pop',
  description: 'Puja para que tu grupo tome el puesto #1. Sin ciclos, sin reset.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
