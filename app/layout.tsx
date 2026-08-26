import './globals.css';

export const metadata = {
  title: 'El Trono — Ranking K-pop',
  description: 'Puja para que tu grupo tome el puesto #1. Sin ciclos, sin reset.',
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
      </head>
      <body>{children}</body>
    </html>
  );
}
