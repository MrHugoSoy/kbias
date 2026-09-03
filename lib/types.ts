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

// Fila de la vista group_battle_feed — una batalla grupo-vs-grupo con
// ambos lados y sus puntos ya armados, para /batallas. `status` viene
// calculado desde la base de datos (upcoming/active/finished) para no
// repetir la comparación de fechas en cada componente.
export type GroupBattleStatus = 'upcoming' | 'active' | 'finished';

export type GroupBattle = {
  battle_id: string;
  starts_at: string;
  ends_at: string;
  status: GroupBattleStatus;
  group_a_id: string;
  group_a_name: string;
  group_a_slug: string;
  group_a_image: string | null;
  group_a_agency: string | null;
  group_a_points: number;
  group_b_id: string;
  group_b_name: string;
  group_b_slug: string;
  group_b_image: string | null;
  group_b_agency: string | null;
  group_b_points: number;
};

// Fila de news_posts, con el grupo asociado ya resuelto (join) cuando
// aplica — un post general (sin grupo) trae `group` en null.
export type NewsPost = {
  id: string;
  title: string;
  body: string;
  cover_url: string | null;
  category: string | null;
  published_at: string;
  group: { name: string; slug: string; image_url: string | null } | null;
};
