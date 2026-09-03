// Mini-gráfica de línea sin librería aparte — solo necesita una serie de
// números (puntos por día) para dibujar la tendencia en la pestaña de
// Estadísticas de cada grupo.
export default function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-12" />;

  const max = Math.max(1, ...data);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12 text-violet-500">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
