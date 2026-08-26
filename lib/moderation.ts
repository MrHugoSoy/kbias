import Filter from 'bad-words-es';

const filter = new Filter();

// Filtro base (inglés + español) contra el contenido más obvio. No es
// exhaustivo — sigue existiendo la moderación manual descrita en /reglas
// para lo que esto no detecte.
export function isOffensive(text: string): boolean {
  return filter.isProfane(text);
}
