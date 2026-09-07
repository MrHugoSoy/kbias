import type { SupabaseClient } from '@supabase/supabase-js';

// Límite genérico de frecuencia: cuenta cuántas filas insertó este usuario
// en `table` en los últimos `windowMinutes` minutos y compara contra
// `maxCount`. Se usa en Comunidad (posts/comentarios/likes/follows), que a
// diferencia de los votos no tienen ningún presupuesto diario que los
// limite de forma natural — sin esto una sola cuenta podría publicar sin
// freno alguno.
export async function isRateLimited(
  supabase: SupabaseClient,
  table: string,
  userColumn: string,
  userId: string,
  maxCount: number,
  windowMinutes: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(userColumn, userId)
    .gte('created_at', since);
  return (count ?? 0) >= maxCount;
}
