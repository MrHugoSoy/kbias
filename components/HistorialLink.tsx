'use client';

export default function HistorialLink() {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    // En lg+ la "Actividad en vivo" vive en el sidebar de donadores;
    // en pantallas chicas vive en el bloque de ActivityFeed más abajo.
    // Cada uno tiene su propio id — se elige el que esté visible.
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const target = document.getElementById(isDesktop ? 'historial-desktop' : 'historial-mobile');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <a href="#historial-mobile" onClick={handleClick}>
      HISTORIAL
    </a>
  );
}
