// Logo de K-pop Wars (public/LogoKW.svg), inlineado como componente en vez
// de <img src> para que el trazo herede el color de texto (currentColor) —
// así respeta el rosa del sitio, modo claro/oscuro y estados de hover,
// igual que hacía el ícono Crown de lucide-react que reemplaza.
export default function LogoKW({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 125.09 98.32" fill="none" stroke="currentColor" strokeWidth="6" strokeMiterlimit="10" className={className}>
      <polygon points="62.67 25.85 54 15.17 62.41 4.77 71.08 15.44 62.67 25.85" />
      <polygon points="50.14 48.08 62.55 61.47 33.68 92.64 5.34 12.52 62.55 41.74 50.14 48.08" />
      <polygon points="74.95 48.08 62.55 61.47 50.14 48.08 62.55 41.74 74.95 48.08" />
      <polygon points="119.75 12.52 91.41 92.64 62.55 61.47 74.95 48.08 62.55 41.74 119.75 12.52" />
    </svg>
  );
}
