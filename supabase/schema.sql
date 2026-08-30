-- ============================================================
-- Esquema base del proyecto "outbid para K-pop"
-- Mecánica: el trono lo tiene el grupo cuya comunidad haya acumulado
-- MÁS PUNTOS EN TOTAL (suma de todos sus impulsos exitosos), no quien
-- haga el impulso individual más grande. Los puntos se compran en
-- paquetes de precio fijo (ver lib/pointPackages.ts), siempre atados a
-- UN grupo en el momento de la compra, y se suman de inmediato al total
-- acumulado de ese grupo. No hay ciclos ni reset — el trono es
-- permanente hasta que otro grupo acumule más puntos.
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
-- Vista: group_rankings — cada grupo con el TOTAL de PUNTOS acumulados
-- de todos sus impulsos exitosos (no el paquete individual más grande),
-- para el podio de top 3 + siguientes 5. top_supporter_* sigue mostrando
-- quién hizo el impulso individual con más puntos a ese grupo, solo como
-- referencia de "quién va liderando".
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
  coalesce(sum(b.points), 0) as total_points,
  (array_agg(b.supporter_name order by b.points desc nulls last))[1] as top_supporter_name,
  (array_agg(b.is_anonymous order by b.points desc nulls last))[1] as top_is_anonymous,
  (array_agg(b.social_url order by b.points desc nulls last))[1] as top_social_url
from groups g
left join bids b on b.group_id = g.id and b.status = 'succeeded'
group by g.id, g.name, g.fandom_name, g.image_url, g.slug, g.bio, g.official_url
order by total_points desc, g.name asc;

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
-- siempre (para el banner "esto ha recaudado $X, el 5% va a
-- fundaciones caritativas").
-- ------------------------------------------------------------
drop view if exists charity_fund;
drop view if exists total_raised;
create view total_raised as
select coalesce(sum(amount_cents), 0) as total_cents
from bids
where status = 'succeeded';

-- ------------------------------------------------------------
-- Vista: charity_fund — cuánto le corresponde a fundaciones
-- caritativas (5% de total_raised). Esto NO transfiere dinero solo,
-- es un cálculo de referencia para que sepas cuánto donar cuando
-- elijas la fundación — la transferencia sigue siendo manual.
-- ------------------------------------------------------------
create view charity_fund as
select
  total_cents,
  round(total_cents * 0.05) as charity_cents
from total_raised;

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
