-- ============================================================
-- Esquema base del proyecto "outbid para K-pop"
-- Mecánica: cada grupo puede tomar el puesto #1 pagando más que
-- la puja actual. No hay ciclos ni reset — el trono es permanente
-- hasta que alguien pague más.
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
  slug text unique not null,             -- para URLs: /group/blackpink
  image_url text,                        -- foto/logo del grupo
  agency text,                           -- opcional: SM, JYP, HYBE, etc.
  claimed_by_fan boolean default false,  -- si un fan/admin verificado gestiona el perfil
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Tabla: bids (cada pago que reclama o intenta reclamar el trono)
-- Guarda TODO el historial — no se borra nada, así se arma el
-- feed de actividad y el "salón de la fama" de campeones pasados.
-- ------------------------------------------------------------
create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  amount_cents integer not null,         -- monto en centavos (evita floats)
  currency text not null default 'usd',
  supporter_name text,                   -- nombre público del fan (opcional/anónimo)
  is_anonymous boolean default false,
  social_url text,                       -- link a su red social (opcional, nunca si es anónimo)
  stripe_payment_intent_id text unique,  -- referencia de Stripe para verificar el pago
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  created_at timestamptz default now()
);

-- Por si la tabla ya existía antes de agregar social_url (idempotente).
alter table bids add column if not exists social_url text;

-- Índice para encontrar rápido la puja más alta vigente
create index if not exists idx_bids_amount on bids (amount_cents desc) where status = 'succeeded';
create index if not exists idx_bids_group on bids (group_id);

-- ------------------------------------------------------------
-- Vista: current_throne — quién tiene el puesto #1 en este momento
-- (la puja exitosa más alta de todo el historial)
-- ------------------------------------------------------------
create or replace view current_throne as
select
  b.id as bid_id,
  b.group_id,
  g.name as group_name,
  g.fandom_name,
  g.image_url,
  b.amount_cents,
  b.supporter_name,
  b.is_anonymous,
  b.created_at,
  b.social_url
from bids b
join groups g on g.id = b.group_id
where b.status = 'succeeded'
order by b.amount_cents desc, b.created_at asc
limit 1;

-- ------------------------------------------------------------
-- Vista: activity_feed — últimas pujas exitosas (para el feed en vivo)
-- ------------------------------------------------------------
create or replace view activity_feed as
select
  b.id,
  b.group_id,
  g.name as group_name,
  g.fandom_name,
  b.amount_cents,
  b.supporter_name,
  b.is_anonymous,
  b.created_at,
  b.social_url
from bids b
join groups g on g.id = b.group_id
where b.status = 'succeeded'
order by b.created_at desc
limit 50;

-- ------------------------------------------------------------
-- Vista: hall_of_fame — cada vez que un grupo NUEVO tomó el trono
-- (útil para mostrar historial de "reinados" sin resetear nada)
-- ------------------------------------------------------------
create or replace view hall_of_fame as
with ranked as (
  select
    b.*,
    g.name as group_name,
    g.fandom_name,
    lag(b.group_id) over (order by b.amount_cents) as prev_group_id
  from bids b
  join groups g on g.id = b.group_id
  where b.status = 'succeeded'
)
select * from ranked
where prev_group_id is distinct from group_id
order by amount_cents desc;

-- ------------------------------------------------------------
-- Vista: top_donor_per_group — por cada grupo, el supporter_name con
-- la suma más alta de todas sus donaciones a ESE grupo específico.
-- Las donaciones anónimas quedan fuera: no hay identidad que reconocer,
-- y no tendría sentido acumularlas todas bajo un solo "fan anónimo".
-- ------------------------------------------------------------
create or replace view top_donor_per_group as
select distinct on (group_id)
  group_id,
  supporter_name,
  is_anonymous,
  sum(amount_cents) over (partition by group_id, supporter_name) as total_donated_cents
from bids
where status = 'succeeded' and is_anonymous = false and supporter_name is not null
order by group_id, total_donated_cents desc;

-- Acelera el group by implícito de la ventana en top_donor_per_group
create index if not exists idx_bids_supporter on bids (group_id, supporter_name)
  where status = 'succeeded' and is_anonymous = false;

-- ------------------------------------------------------------
-- Vista: group_rankings — cada grupo con su puja individual más
-- alta (su "récord personal"), para el podio de top 3 + siguientes 5.
-- El #1 de esta vista es el mismo grupo que current_throne (misma
-- métrica), pero aquí se ve también el resto de los grupos.
-- ------------------------------------------------------------
create or replace view group_rankings as
select
  g.id as group_id,
  g.name as group_name,
  g.fandom_name,
  g.image_url,
  coalesce(max(b.amount_cents), 0) as best_bid_cents,
  (array_agg(b.supporter_name order by b.amount_cents desc nulls last))[1] as top_supporter_name,
  (array_agg(b.is_anonymous order by b.amount_cents desc nulls last))[1] as top_is_anonymous,
  (array_agg(b.social_url order by b.amount_cents desc nulls last))[1] as top_social_url
from groups g
left join bids b on b.group_id = g.id and b.status = 'succeeded'
group by g.id, g.name, g.fandom_name, g.image_url
order by best_bid_cents desc, g.name asc;

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
create policy "site_stats_public_read" on site_stats for select using (true);
-- Sin policy de insert/update para anon: el incremento pasa por la
-- función security definer de abajo, nunca por escritura directa.

-- ------------------------------------------------------------
-- Vista: total_raised — suma de todas las pujas exitosas de
-- siempre (para el banner "esto ha recaudado $X, el 5% va a
-- fundaciones caritativas").
-- ------------------------------------------------------------
create or replace view total_raised as
select coalesce(sum(amount_cents), 0) as total_cents
from bids
where status = 'succeeded';

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
create policy "groups_public_read" on groups for select using (true);
create policy "bids_public_read" on bids for select using (status = 'succeeded');

-- Las inserciones de bids se hacen SOLO desde el backend (service role),
-- nunca directo desde el cliente, para evitar fraude en el monto.
-- No se crea policy de insert para el rol "anon".

-- ------------------------------------------------------------
-- Habilitar Realtime en bids para el feed en vivo
-- ------------------------------------------------------------
alter publication supabase_realtime add table bids;
