-- ============================================================
-- Esquema base del proyecto "outbid para K-pop"
-- Mecánica actual: el trono lo tiene el grupo con MÁS VOTOS EN TOTAL.
-- El voto es GRATIS: requiere cuenta registrada (ver `votes`) y cada
-- cuenta puede votar una vez por día calendario (UTC), para el grupo
-- que elija. No hay ciclos ni reset — el trono es permanente hasta que
-- otro grupo acumule más votos.
--
-- El cobro con Stripe (`bids`, `lib/pointPackages.ts`) está desactivado
-- por el momento — el código y las tablas se dejan intactos por si se
-- reactiva más adelante, pero el ranking ya no depende de `bids`.
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabla: groups (grupos de K-pop que pueden competir)
-- ------------------------------------------------------------
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- ej. "BLACKPINK"
  fandom_name text,                      -- ej. "BLINK" (nombre oficial del fandom)
  slug text unique not null,             -- para URLs: /grupo/blackpink
  image_url text,                        -- foto/logo del grupo
  bio text,                              -- descripción corta (1-2 líneas) para su tarjeta y página propia
  official_url text,                     -- link oficial del grupo (Instagram, sitio, etc.)
  agency text,                           -- opcional: SM, JYP, HYBE, etc.
  claimed_by_fan boolean default false,  -- si un fan/admin verificado gestiona el perfil
  created_at timestamptz default now()
);

-- Por si la tabla ya existía antes de agregar estas columnas (idempotente).
alter table groups add column if not exists bio text;
alter table groups add column if not exists official_url text;
-- Puesto "congelado" al inicio del día (ver sync_rank_snapshots() más abajo)
-- — tiene que existir antes de la vista group_rankings, que ya lo expone.
alter table groups add column if not exists rank_snapshot_date date;
alter table groups add column if not exists rank_snapshot_value integer;

-- ------------------------------------------------------------
-- Tabla: bids (cada pago que reclama o intenta reclamar el trono)
-- Guarda TODO el historial — no se borra nada, así se arma el
-- feed de actividad y el "salón de la fama" de campeones pasados.
-- ------------------------------------------------------------
create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  amount_cents integer not null,         -- monto en centavos (evita floats) — precio real cobrado
  points integer not null default 0,     -- puntos otorgados por el paquete comprado (ver lib/pointPackages.ts)
  package_id text,                       -- id del paquete elegido, para referencia/analítica
  currency text not null default 'usd',
  supporter_name text,                   -- nombre público del fan (opcional/anónimo)
  is_anonymous boolean default false,
  social_url text,                       -- link a su red social (opcional, nunca si es anónimo)
  message text,                          -- mensaje corto opcional del fan (máx. 140 caracteres, validado en /api/bid)
  ip_address text,                       -- IP de quien inició la puja (para el tope diario anti-abuso)
  stripe_payment_intent_id text unique,  -- referencia de Stripe para verificar el pago
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  created_at timestamptz default now()
);

-- Por si la tabla ya existía antes de agregar estas columnas (idempotente).
alter table bids add column if not exists social_url text;
alter table bids add column if not exists ip_address text;
alter table bids add column if not exists message text;
alter table bids add column if not exists points integer not null default 0;
alter table bids add column if not exists package_id text;

-- Índice para encontrar rápido el impulso con más puntos vigente
-- (reemplaza al índice viejo por amount_cents, ya no es el criterio de ranking)
drop index if exists idx_bids_amount;
create index if not exists idx_bids_points on bids (points desc) where status = 'succeeded';
create index if not exists idx_bids_group on bids (group_id);
-- Acelera la suma del tope diario por IP en /api/bid (pujas confirmadas
-- de las últimas 24h, y reservas 'pending' de los últimos 30 min).
create index if not exists idx_bids_ip_time on bids (ip_address, created_at) where status = 'succeeded';
create index if not exists idx_bids_ip_time_pending on bids (ip_address, created_at) where status = 'pending';

-- ------------------------------------------------------------
-- Vista: activity_feed — últimas pujas exitosas (para el feed en vivo)
-- ------------------------------------------------------------
drop view if exists activity_feed;
create view activity_feed as
select
  b.id,
  b.group_id,
  g.name as group_name,
  g.fandom_name,
  b.amount_cents,
  b.points,
  b.supporter_name,
  b.is_anonymous,
  b.created_at,
  b.social_url,
  b.message
from bids b
join groups g on g.id = b.group_id
where b.status = 'succeeded'
order by b.created_at desc
limit 50;

-- ------------------------------------------------------------
-- Vista: top_donor_per_group — por cada grupo, el supporter_name con
-- la suma más alta de PUNTOS acumulados a ESE grupo específico.
-- Los impulsos anónimos quedan fuera: no hay identidad que reconocer,
-- y no tendría sentido acumularlas todas bajo un solo "fan anónimo".
-- ------------------------------------------------------------
drop view if exists top_donor_per_group;
create view top_donor_per_group as
select distinct on (group_id)
  group_id,
  supporter_name,
  is_anonymous,
  sum(points) over (partition by group_id, supporter_name) as total_points
from bids
where status = 'succeeded' and is_anonymous = false and supporter_name is not null
order by group_id, total_points desc;

-- Acelera el group by implícito de la ventana en top_donor_per_group
create index if not exists idx_bids_supporter on bids (group_id, supporter_name)
  where status = 'succeeded' and is_anonymous = false;

-- ------------------------------------------------------------
-- Tabla: votes — cada cuenta registrada tiene 5 puntos GRATIS por día
-- calendario (UTC) para repartir entre los grupos que quiera (todos a
-- uno, o divididos) — no es "un voto", es una asignación de puntos; una
-- fila = una asignación, con su cantidad en `points`. Reemplaza a
-- `bids`/Stripe como fuente del ranking mientras el cobro está
-- desactivado (ver nota de arriba en `bids` — esa tabla y el flujo de
-- Stripe se dejan intactos, sin usarse, por si se reactiva el cobro más
-- adelante).
-- ------------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  points integer not null default 1 check (points between 1 and 5),
  message text,                          -- mensaje corto opcional del votante (máx. 140, validado en /api/vote)
  created_at timestamptz default now()
);

alter table votes add column if not exists message text;
alter table votes add column if not exists points integer not null default 1;
do $$
begin
  alter table votes add constraint votes_points_range check (points between 1 and 5);
exception when duplicate_object then null;
end $$;

-- Reemplazado por el cooldown de 24h en cast_vote() — este índice solo
-- limitaba por día calendario UTC, que es justo el bug que se reporta.
drop index if exists idx_votes_one_per_day;

create index if not exists idx_votes_group on votes (group_id);
create index if not exists idx_votes_user_created on votes (user_id, created_at desc);

-- Inserta una asignación de puntos solo si no se pasa del presupuesto de 5
-- por día calendario UTC (sumando lo ya repartido hoy entre todos los
-- grupos). El advisory lock serializa llamadas concurrentes del mismo
-- usuario dentro de la transacción — sin él, dos requests simultáneos
-- podrían leer "presupuesto libre" antes de que cualquiera inserte, y las
-- dos pasarían aunque juntas se pasen de 5. SECURITY DEFINER + el
-- REVOKE/GRANT de abajo aseguran que solo el service role (el usado por
-- /api/vote, después de verificar el token real) puede llamar esta
-- función. Las versiones anteriores son firmas distintas para Postgres
-- (el tipo de los parámetros es parte de la identidad de la función) —
-- hay que borrarlas explícitamente o quedarían duplicadas junto a esta.
drop function if exists cast_vote(uuid, uuid);
drop function if exists cast_vote(uuid, uuid, text);
-- create or replace no permite cambiar las columnas de salida de una
-- función existente (aquí id/created_at -> vote_id/vote_created_at) —
-- hay que borrar la versión vieja de esta misma firma primero.
drop function if exists cast_vote(uuid, uuid, integer, text);

-- Racha de días activos + bono de XP — factorizado aparte de cast_vote()
-- para que cast_song_vote() (batallas de canciones, más abajo) otorgue
-- exactamente la misma XP sin duplicar esta lógica. La bolsa de puntos ya
-- limita a un único "día activo" por cuenta (repartir varias veces el
-- mismo día no cuenta doble como racha nueva). El bono crece con la racha
-- hasta un tope de 10 XP/día para no premiar rachas larguísimas de forma
-- desproporcionada frente a repartir puntos (1 XP por punto).
create or replace function grant_vote_xp(p_user_id uuid, p_points integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_last_active date;
  v_prev_streak integer;
  v_new_streak integer;
  v_streak_bonus integer := 0;
begin
  select p.last_active_date, p.current_streak into v_last_active, v_prev_streak
  from profiles p where p.id = p_user_id;

  if v_last_active is null or v_last_active < v_today - 1 then
    v_new_streak := 1;
    v_streak_bonus := 1;
  elsif v_last_active = v_today - 1 then
    v_new_streak := coalesce(v_prev_streak, 0) + 1;
    v_streak_bonus := least(v_new_streak, 10);
  else
    -- Ya había una entrada hoy (segunda asignación del mismo día): la
    -- racha no cambia y no se vuelve a dar el bono.
    v_new_streak := coalesce(v_prev_streak, 1);
  end if;

  insert into profiles (id, xp, current_streak, last_active_date)
  values (p_user_id, p_points + v_streak_bonus, v_new_streak, v_today)
  on conflict (id) do update
  set xp = profiles.xp + p_points + v_streak_bonus,
      current_streak = v_new_streak,
      last_active_date = v_today;
end;
$$;

revoke all on function grant_vote_xp(uuid, integer) from public;
grant execute on function grant_vote_xp(uuid, integer) to service_role;

-- Las columnas de salida se llaman vote_id/vote_created_at (no "id" a
-- secas) para no chocar con la columna profiles.id: RETURNS TABLE crea
-- variables plpgsql con esos nombres, y una que se llamara "id" volvía
-- ambiguo el "on conflict (id)" del insert a profiles de abajo.
create or replace function cast_vote(p_user_id uuid, p_group_id uuid, p_points integer, p_message text default null)
returns table (vote_id uuid, vote_created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used_today integer;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  if p_points is null or p_points < 1 or p_points > 5 then
    raise exception 'invalid_points';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- El presupuesto de 5 puntos diarios es compartido entre votos de grupo
  -- y votos de batallas de canciones (song_votes, ver más abajo) — una
  -- sola economía de puntos en todo el sitio.
  select
    coalesce((select sum(v.points) from votes v where v.user_id = p_user_id and v.created_at >= v_day_start), 0) +
    coalesce((select sum(sv.points) from song_votes sv where sv.user_id = p_user_id and sv.created_at >= v_day_start), 0)
  into v_used_today;

  if v_used_today + p_points > 5 then
    raise exception 'daily_budget_exceeded';
  end if;

  perform grant_vote_xp(p_user_id, p_points);

  return query
  insert into votes (user_id, group_id, points, message)
  values (p_user_id, p_group_id, p_points, p_message)
  returning votes.id, votes.created_at;
end;
$$;

revoke all on function cast_vote(uuid, uuid, integer, text) from public;
grant execute on function cast_vote(uuid, uuid, integer, text) to service_role;

alter table votes enable row level security;
drop policy if exists "votes_public_read" on votes;
create policy "votes_public_read" on votes for select using (true);
-- Sin policy de insert para anon/authenticated: todo pasa por /api/vote,
-- que verifica el token real de sesión y escribe con el service role —
-- igual que bids con Stripe antes.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end $$;

-- ------------------------------------------------------------
-- Batallas de canciones: cada grupo puede tener varias canciones (se
-- cargan a mano, igual que los grupos); el sistema empareja canciones
-- activas al azar en "batallas" de duración fija y la gente vota por una
-- de las dos usando el mismo presupuesto de 5 puntos diarios que ya usan
-- los votos de grupo (ver el chequeo compartido en cast_vote/cast_song_vote).
-- ------------------------------------------------------------
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  cover_url text,
  active boolean not null default true,  -- en false para retirarla de futuros emparejamientos sin borrar su historial
  created_at timestamptz default now()
);

create index if not exists idx_songs_group on songs (group_id);

alter table songs enable row level security;
drop policy if exists "songs_public_read" on songs;
create policy "songs_public_read" on songs for select using (true);
-- Sin policy de insert/update: se cargan a mano con el service role desde el SQL Editor.

-- Duración fija de cada batalla, en horas — 48h por defecto ("24-48h
-- fijas"). Cambiar esta constante en ensure_active_song_battles() más
-- abajo si se quiere otra duración.
create table if not exists song_battles (
  id uuid primary key default gen_random_uuid(),
  song_a_id uuid not null references songs(id) on delete cascade,
  song_b_id uuid not null references songs(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_song_battles_ends_at on song_battles (ends_at desc);

alter table song_battles enable row level security;
drop policy if exists "song_battles_public_read" on song_battles;
create policy "song_battles_public_read" on song_battles for select using (true);

create table if not exists song_votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references song_battles(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null default 1 check (points between 1 and 5),
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_song_votes_battle on song_votes (battle_id);
create index if not exists idx_song_votes_user_created on song_votes (user_id, created_at desc);

alter table song_votes enable row level security;
drop policy if exists "song_votes_public_read" on song_votes;
create policy "song_votes_public_read" on song_votes for select using (true);
-- Sin policy de insert: todo pasa por /api/song-vote (cast_song_vote), que
-- verifica el token real de sesión y escribe con el service role.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'song_votes'
  ) then
    alter publication supabase_realtime add table song_votes;
  end if;
end $$;

-- Arma batallas nuevas cuando no queda ninguna activa: toma las canciones
-- activas que no estén ya en una batalla vigente, las revuelve al azar y
-- las empareja de dos en dos (la que sobra, si el número es impar, se
-- queda fuera de esta ronda). Se llama en cada carga de la portada — si ya
-- hay batallas activas no hace nada, así que es barato.
create or replace function ensure_active_song_battles()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_battle_hours constant integer := 48;
begin
  if exists (select 1 from song_battles where ends_at > now()) then
    return;
  end if;

  with available as (
    select id
    from songs
    where active = true
    order by random()
  ),
  numbered as (
    select id, row_number() over () as rn
    from available
  ),
  paired as (
    select a.id as song_a_id, b.id as song_b_id
    from numbered a
    join numbered b on b.rn = a.rn + 1
    where a.rn % 2 = 1
  )
  insert into song_battles (song_a_id, song_b_id, starts_at, ends_at)
  select song_a_id, song_b_id, now(), now() + (v_battle_hours || ' hours')::interval
  from paired;
end;
$$;

grant execute on function ensure_active_song_battles() to anon, authenticated;

-- Igual que cast_vote() pero para una batalla de canciones — mismo
-- presupuesto de 5 puntos diarios (chequeado contra votes + song_votes) y
-- misma XP otorgada vía grant_vote_xp().
create or replace function cast_song_vote(p_user_id uuid, p_battle_id uuid, p_song_id uuid, p_points integer, p_message text default null)
returns table (song_vote_id uuid, song_vote_created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used_today integer;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_battle song_battles%rowtype;
begin
  if p_points is null or p_points < 1 or p_points > 5 then
    raise exception 'invalid_points';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_battle from song_battles where id = p_battle_id;
  if v_battle.id is null or v_battle.ends_at <= now() then
    raise exception 'battle_not_active';
  end if;
  if p_song_id != v_battle.song_a_id and p_song_id != v_battle.song_b_id then
    raise exception 'invalid_song';
  end if;

  select
    coalesce((select sum(v.points) from votes v where v.user_id = p_user_id and v.created_at >= v_day_start), 0) +
    coalesce((select sum(sv.points) from song_votes sv where sv.user_id = p_user_id and sv.created_at >= v_day_start), 0)
  into v_used_today;

  if v_used_today + p_points > 5 then
    raise exception 'daily_budget_exceeded';
  end if;

  perform grant_vote_xp(p_user_id, p_points);

  return query
  insert into song_votes (battle_id, song_id, user_id, points, message)
  values (p_battle_id, p_song_id, p_user_id, p_points, p_message)
  returning song_votes.id, song_votes.created_at;
end;
$$;

revoke all on function cast_song_vote(uuid, uuid, uuid, integer, text) from public;
grant execute on function cast_song_vote(uuid, uuid, uuid, integer, text) to service_role;

-- Vista: song_battle_feed — batallas activas con los datos ya armados
-- (canción + grupo de cada lado, y los puntos que lleva cada una) para
-- mostrarlas directo en la portada.
drop view if exists song_battle_feed;
create view song_battle_feed as
select
  b.id as battle_id,
  b.starts_at,
  b.ends_at,
  sa.id as song_a_id,
  sa.title as song_a_title,
  sa.cover_url as song_a_cover,
  ga.id as song_a_group_id,
  ga.name as song_a_group_name,
  ga.slug as song_a_group_slug,
  ga.image_url as song_a_group_image,
  sb.id as song_b_id,
  sb.title as song_b_title,
  sb.cover_url as song_b_cover,
  gb.id as song_b_group_id,
  gb.name as song_b_group_name,
  gb.slug as song_b_group_slug,
  gb.image_url as song_b_group_image,
  coalesce((select sum(sv.points) from song_votes sv where sv.battle_id = b.id and sv.song_id = b.song_a_id), 0) as song_a_points,
  coalesce((select sum(sv.points) from song_votes sv where sv.battle_id = b.id and sv.song_id = b.song_b_id), 0) as song_b_points
from song_battles b
join songs sa on sa.id = b.song_a_id
join groups ga on ga.id = sa.group_id
join songs sb on sb.id = b.song_b_id
join groups gb on gb.id = sb.group_id
where b.ends_at > now()
order by b.ends_at asc;

-- ------------------------------------------------------------
-- Vista: group_rankings — cada grupo con el total de votos del MES
-- calendario (UTC) en curso (1 voto = 1 punto). El ranking se reinicia
-- solo con volver a filtrar por el mes actual — no hay ningún borrado ni
-- cron: los votos de meses pasados quedan intactos en `votes` y son la
-- base del Salón de la Fama (ver monthly_champions más abajo).
-- ------------------------------------------------------------
drop view if exists group_rankings;
create view group_rankings as
select
  g.id as group_id,
  g.name as group_name,
  g.fandom_name,
  g.image_url,
  g.slug,
  g.bio,
  g.official_url,
  g.rank_snapshot_value,
  coalesce(
    sum(v.points) filter (
      where v.created_at >= (date_trunc('month', now() at time zone 'utc') at time zone 'utc')
    ),
    0
  ) as total_points
from groups g
left join votes v on v.group_id = g.id
group by g.id, g.name, g.fandom_name, g.image_url, g.slug, g.bio, g.official_url, g.rank_snapshot_value
order by total_points desc, g.name asc;

-- Puesto "congelado" al inicio del día calendario (UTC) en curso (columnas
-- agregadas junto a la tabla groups, arriba) — se compara contra el puesto
-- en vivo para mostrar la flechita de "subió/bajó" en el ranking, sin
-- inventar un historial completo de posiciones. sync_rank_snapshots() se
-- llama en cada carga de la portada (barato: si ya se guardó hoy, no hace
-- nada) y solo se actualiza una vez por día — así el valor se queda fijo
-- como "puesto de ayer" durante todo el día de hoy en vez de recalcularse
-- en cada voto.
create or replace function sync_rank_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if exists (select 1 from groups where rank_snapshot_date = v_today) then
    return;
  end if;

  with ranked as (
    select group_id, rank() over (order by total_points desc) as rnk
    from group_rankings
  )
  update groups g
  set rank_snapshot_date = v_today,
      rank_snapshot_value = r.rnk
  from ranked r
  where r.group_id = g.id;
end;
$$;

grant execute on function sync_rank_snapshots() to anon, authenticated;

-- ------------------------------------------------------------
-- Vista: monthly_rankings — el ranking completo de cada mes calendario
-- (UTC) que ya tuvo al menos un voto, incluido el mes en curso. Es la
-- base tanto del Salón de la Fama (filtra rank = 1 y excluye el mes
-- actual, que sigue en juego) como de cualquier detalle mes a mes.
-- ------------------------------------------------------------
-- monthly_champions depende de esta vista — hay que borrarla primero o
-- Postgres rechaza el drop de monthly_rankings al volver a correr esto.
drop view if exists monthly_champions;
drop view if exists monthly_rankings;
create view monthly_rankings as
select
  date_trunc('month', v.created_at at time zone 'utc')::date as month_start,
  g.id as group_id,
  g.name as group_name,
  g.fandom_name,
  g.image_url,
  g.slug,
  sum(v.points) as total_points,
  rank() over (
    partition by date_trunc('month', v.created_at at time zone 'utc')
    order by sum(v.points) desc
  ) as rank
from votes v
join groups g on g.id = v.group_id
group by date_trunc('month', v.created_at at time zone 'utc'), g.id, g.name, g.fandom_name, g.image_url, g.slug;

-- Vista: monthly_champions — el #1 de cada mes YA CERRADO (excluye el mes
-- en curso, que todavía puede cambiar de dueño). Esto es el "registro de
-- ganadores" del Salón de la Fama.
create view monthly_champions as
select *
from monthly_rankings
where rank = 1
  and month_start < date_trunc('month', now() at time zone 'utc')::date
order by month_start desc;

-- ------------------------------------------------------------
-- Tabla: profiles — nombre de usuario único y opcional por cuenta.
-- Se guarda siempre en minúsculas (normalizado en /api/username) para que
-- el unique constraint funcione sin distinguir mayúsculas/minúsculas.
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_species text,   -- animalito pixel elegido (ver components/PixelAvatar.tsx); null = se deriva del id
  avatar_url text,       -- foto real subida por el usuario; si existe, tiene prioridad sobre avatar_species
  created_at timestamptz default now()
);

-- Por si la tabla ya existía antes de agregar estas columnas (idempotente).
alter table profiles alter column username drop not null;
alter table profiles add column if not exists avatar_species text;
alter table profiles add column if not exists avatar_url text;

-- Sistema de experiencia (XP) y nivel: xp se gana repartiendo puntos (1 XP
-- por punto) y con un bono por racha de días activos seguidos, ambos
-- otorgados dentro de cast_vote(). El nivel no se guarda — se deriva del xp
-- con la misma fórmula en lib/level.ts, así nunca puede desincronizarse.
alter table profiles add column if not exists xp integer not null default 0;
alter table profiles add column if not exists current_streak integer not null default 0;
alter table profiles add column if not exists last_active_date date;

-- Recompensas por nivel (ver lib/perks.ts para qué nivel desbloquea qué) —
-- banner_url es la primera: se sube igual que la foto de perfil, al bucket
-- "avatars" ya existente, y solo /api/banner la deja guardar si el nivel
-- derivado del xp ya alcanza el requisito.
alter table profiles add column if not exists banner_url text;

alter table profiles enable row level security;
drop policy if exists "profiles_public_read" on profiles;
create policy "profiles_public_read" on profiles for select using (true);
-- Sin policy de insert/update para anon/authenticated: pasa por
-- /api/username y /api/avatar, que verifican el token real de sesión y
-- escriben con el service role.

-- ------------------------------------------------------------
-- Vista: vote_feed — últimos votos (para el feed en vivo), con el nombre
-- de usuario y avatar del votante si los tiene configurados. Si no eligió
-- username, username sale null y el feed muestra "un fan" — el avatar
-- pixel siempre se puede mostrar (se deriva del user_id si no hay uno
-- elegido ni foto subida).
-- ------------------------------------------------------------
drop view if exists vote_feed;
create view vote_feed as
select
  v.id,
  v.group_id,
  g.name as group_name,
  g.fandom_name,
  v.created_at,
  v.user_id,
  v.message,
  v.points,
  p.username,
  p.avatar_species,
  p.avatar_url,
  coalesce(p.xp, 0) as xp
from votes v
join groups g on g.id = v.group_id
left join profiles p on p.id = v.user_id
order by v.created_at desc
limit 50;

-- ------------------------------------------------------------
-- Tabla: group_comments — foro de discusión por grupo. Cualquier cuenta
-- registrada puede comentar; se modera igual que los mensajes de voto
-- (isOffensive en lib/moderation.ts, validado en /api/comments).
-- ------------------------------------------------------------
create table if not exists group_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text,               -- null solo si deleted_at está lleno (ver constraint abajo)
  parent_id uuid references group_comments(id) on delete cascade,
  updated_at timestamptz,  -- se llena solo si el autor lo edita — muestra "(editado)"
  deleted_at timestamptz,  -- borrado suave: se limpia el body pero la fila queda
                           -- para no romper el hilo de respuestas colgadas de ella
  created_at timestamptz default now()
);

alter table group_comments add column if not exists parent_id uuid references group_comments(id) on delete cascade;
alter table group_comments add column if not exists updated_at timestamptz;
alter table group_comments add column if not exists deleted_at timestamptz;
-- El borrado suave limpia body a null en vez de borrar la fila (ver arriba).
alter table group_comments alter column body drop not null;

-- Sin esto, un `body = null` sin `deleted_at` (un bug o un UPDATE hecho a
-- mano fuera de /api/comments) se vería como un comentario "vivo" vacío en
-- vez de mostrar "Comentario eliminado" — el cliente decide qué mostrar
-- únicamente mirando deleted_at.
do $$
begin
  alter table group_comments
    add constraint group_comments_body_or_deleted check (deleted_at is not null or body is not null);
exception when duplicate_object then null;
end $$;

create index if not exists idx_group_comments_group_created on group_comments (group_id, created_at desc);
create index if not exists idx_group_comments_parent on group_comments (parent_id);

alter table group_comments enable row level security;
drop policy if exists "group_comments_public_read" on group_comments;
create policy "group_comments_public_read" on group_comments for select using (true);
-- Sin policy de insert/delete para anon/authenticated: todo pasa por
-- /api/comments, que verifica el token real de sesión y escribe con el
-- service role — mismo patrón que votes/profiles.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_comments'
  ) then
    alter publication supabase_realtime add table group_comments;
  end if;
end $$;

-- ------------------------------------------------------------
-- Tabla: comment_likes — un like por cuenta por comentario. El unique
-- constraint es lo que hace el toggle seguro contra doble clic / dos
-- pestañas, no solo el chequeo del API.
-- ------------------------------------------------------------
create table if not exists comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references group_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (comment_id, user_id)
);

create index if not exists idx_comment_likes_comment on comment_likes (comment_id);

alter table comment_likes enable row level security;
-- Sin policy de select/insert/delete para anon/authenticated: todo pasa
-- por /api/comments/likes, que verifica el token real de sesión y escribe
-- con el service role.

-- Necesario para que un DELETE traiga el comment_id en el payload de
-- Realtime (por default solo manda la primary key) — así el like en vivo
-- de otros usuarios se puede restar del contador sin otra consulta.
alter table comment_likes replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comment_likes'
  ) then
    alter publication supabase_realtime add table comment_likes;
  end if;
end $$;

-- Vista: group_comments_feed — comentarios con username/avatar del autor
-- y el total de likes (quién le dio like, si el que pregunta ya lo hizo,
-- se resuelve aparte en /api/comments, que sí conoce al usuario).
drop view if exists group_comments_feed;
create view group_comments_feed as
select
  c.id,
  c.group_id,
  c.body,
  c.parent_id,
  c.created_at,
  c.updated_at,
  c.deleted_at,
  c.user_id,
  p.username,
  p.avatar_species,
  p.avatar_url,
  coalesce(p.xp, 0) as xp,
  (select count(*) from comment_likes cl where cl.comment_id = c.id)::int as like_count
from group_comments c
left join profiles p on p.id = c.user_id
order by c.created_at desc;

-- ------------------------------------------------------------
-- Tabla: notifications — alerta cuando alguien responde uno de tus
-- comentarios. Solo se genera para respuestas de otra persona (nunca te
-- notificas a ti mismo); se inserta desde /api/comments al crear la
-- respuesta, con el service role.
-- ------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- quien recibe la alerta
  actor_id uuid not null references auth.users(id) on delete cascade,  -- quien respondió
  comment_id uuid not null references group_comments(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_created on notifications (user_id, created_at desc);

alter table notifications enable row level security;
-- Sin policy de select/insert para anon/authenticated: todo pasa por
-- /api/notifications (leer/marcar leído) y /api/comments (crear al
-- responder), que verifican el token real de sesión y usan el service role.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- Vista: notifications_feed — la alerta con los datos ya armados para
-- mostrarla (quién respondió, en qué grupo, y el texto de la respuesta).
drop view if exists notifications_feed;
create view notifications_feed as
select
  n.id,
  n.user_id,
  n.comment_id,
  n.group_id,
  n.read_at,
  n.created_at,
  g.name as group_name,
  g.slug as group_slug,
  c.body as comment_body,
  c.parent_id,
  p.username as actor_username,
  p.avatar_species as actor_avatar_species,
  p.avatar_url as actor_avatar_url
from notifications n
join groups g on g.id = n.group_id
join group_comments c on c.id = n.comment_id
left join profiles p on p.id = n.actor_id
order by n.created_at desc;

-- ------------------------------------------------------------
-- Storage: bucket "avatars" para fotos de perfil subidas por el usuario.
-- Público de lectura; cada quien solo puede escribir dentro de su propia
-- carpeta ({user_id}/archivo.ext), verificado por RLS con auth.uid().
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- Contador de visitas totales del sitio (para la barra "X visitas
-- desde el lanzamiento", estilo outbid.lol). Fila única, incrementada
-- de forma atómica en cada carga de la página vía RPC.
-- ------------------------------------------------------------
create table if not exists site_stats (
  id smallint primary key default 1,
  total_visits bigint not null default 0,
  constraint site_stats_singleton check (id = 1)
);

insert into site_stats (id, total_visits) values (1, 0)
on conflict (id) do nothing;

alter table site_stats enable row level security;
drop policy if exists "site_stats_public_read" on site_stats;
create policy "site_stats_public_read" on site_stats for select using (true);
-- Sin policy de insert/update para anon: el incremento pasa por la
-- función security definer de abajo, nunca por escritura directa.

-- ------------------------------------------------------------
-- Vista: total_raised — suma de todas las pujas exitosas de
-- siempre (para el banner "esto ha recaudado $X").
-- ------------------------------------------------------------
-- charity_fund (5% de reserva para fundaciones caritativas) se eliminó:
-- ya no es parte del producto, ver Reglas/Términos.
drop view if exists charity_fund;
drop view if exists total_raised;
create view total_raised as
select coalesce(sum(amount_cents), 0) as total_cents
from bids
where status = 'succeeded';

-- ------------------------------------------------------------
-- Tabla: claim_requests — solicitudes de artistas/management para
-- reclamar el perfil oficial de su grupo. Se revisan a mano (no hay
-- verificación automática de identidad); al aprobar una, actualiza
-- `groups.claimed_by_fan` manualmente desde el SQL Editor.
-- ------------------------------------------------------------
create table if not exists claim_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  proof_url text,     -- link que demuestre la relación con el grupo (cuenta oficial, etc.)
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table claim_requests enable row level security;

-- Cualquiera puede enviar una solicitud, pero nadie puede leerlas desde
-- el cliente — se revisan a mano desde el dashboard de Supabase.
drop policy if exists "claim_requests_public_insert" on claim_requests;
create policy "claim_requests_public_insert" on claim_requests for insert with check (true);

create or replace function increment_site_visits()
returns bigint
language sql
security definer
set search_path = public
as $$
  update site_stats set total_visits = total_visits + 1 where id = 1
  returning total_visits;
$$;

grant execute on function increment_site_visits() to anon, authenticated;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table groups enable row level security;
alter table bids enable row level security;

-- Cualquiera puede leer grupos y pujas exitosas (es un ranking público)
drop policy if exists "groups_public_read" on groups;
create policy "groups_public_read" on groups for select using (true);
drop policy if exists "bids_public_read" on bids;
create policy "bids_public_read" on bids for select using (status = 'succeeded');

-- Las inserciones de bids se hacen SOLO desde el backend (service role),
-- nunca directo desde el cliente, para evitar fraude en el monto.
-- No se crea policy de insert para el rol "anon".

-- ------------------------------------------------------------
-- Habilitar Realtime en bids para el feed en vivo
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table bids;
  end if;
end $$;
