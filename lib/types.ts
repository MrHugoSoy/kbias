// Fila de la vista group_rankings — un grupo con su total de puntos del mes
// calendario (UTC) en curso. Se comparte entre las pantallas que muestran el
// ranking (portada, página de grupo, estadísticas) para poder actualizarlo
// en vivo con el mismo shape sin repetir el tipo en cada archivo.
export type RankingRow = {
  group_id: string;
  group_name: string;
  fandom_name: string | null;
  image_url: string | null;
  slug: string;
  bio: string | null;
  official_url: string | null;
  total_points: number;
  rank_snapshot_value: number | null;
  claimed_by_fan: boolean | null;
  debut_date: string | null;
  country: string | null;
  genre: string | null;
  best_rank: number | null;
};

// Fila de news_posts, con el grupo asociado ya resuelto (join) cuando
// aplica — un post general (sin grupo) trae `group` en null.
export type NewsPost = {
  id: string;
  title: string;
  body: string;
  cover_url: string | null;
  published_at: string;
  group: { name: string; slug: string; image_url: string | null } | null;
};
