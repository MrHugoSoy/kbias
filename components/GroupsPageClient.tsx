'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Mic2,
  Flame,
  Clock,
  Trophy,
  Disc3,
  Flag,
  Users,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import type { GroupWithStats } from '@/lib/types';

type SortKey = 'rank' | 'name' | 'rank_desc';
type View = 'grid' | 'list';

const PAGE_SIZE = 9;

const BADGE_BY_RANK: Record<number, string> = {
  1: 'bg-amber-400 text-black',
  2: 'bg-neutral-300 text-black',
  3: 'bg-orange-400 text-black',
};

function BattleBadge({ status }: { status: GroupWithStats['battle_status'] }) {
  if (status === 'battle') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white" /> En batalla
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-violet-500 px-2 py-0.5 rounded-full">
        <Clock className="w-2.5 h-2.5" /> Próxima
      </span>
    );
  }
  return null;
}

function GroupImage({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Mic2 className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
      )}
    </div>
  );
}

function GroupCard({ group }: { group: GroupWithStats }) {
  const badge = BADGE_BY_RANK[group.rank] ?? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black';
  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3]">
        <GroupImage image={group.image_url} name={group.name} />
        <span className={`absolute top-2 left-2 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shadow ${badge}`}>
          {group.rank}
        </span>
        {group.battle_status !== 'none' && (
          <span className="absolute top-2 right-2">
            <BattleBadge status={group.battle_status} />
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div>
          <p className="font-black truncate">{group.name}</p>
          <p className="text-xs text-neutral-500 truncate">{group.agency || group.fandom_name || '—'}</p>
        </div>
        <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-auto">
          {group.total_points.toLocaleString('es-MX')} {group.total_points === 1 ? 'punto' : 'puntos'}
        </p>
        <Link
          href={`/grupo/${group.slug}`}
          className="text-center text-sm font-bold border border-neutral-300 dark:border-neutral-700 rounded-lg py-1.5 hover:border-violet-400 dark:hover:border-violet-500 transition"
        >
          Ver perfil
        </Link>
      </div>
    </div>
  );
}

function GroupRow({ group }: { group: GroupWithStats }) {
  const badge = BADGE_BY_RANK[group.rank] ?? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black';
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-xl p-3">
      <span className={`w-7 h-7 shrink-0 rounded-full text-xs font-black flex items-center justify-center ${badge}`}>{group.rank}</span>
      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden">
        <GroupImage image={group.image_url} name={group.name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{group.name}</p>
        <p className="text-xs text-neutral-500 truncate">{group.agency || group.fandom_name || '—'}</p>
      </div>
      <BattleBadge status={group.battle_status} />
      <span className="text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0 w-20 text-right">
        {group.total_points.toLocaleString('es-MX')} pts
      </span>
      <Link
        href={`/grupo/${group.slug}`}
        className="shrink-0 text-sm font-bold border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 hover:border-violet-400 dark:hover:border-violet-500 transition"
      >
        Ver perfil
      </Link>
    </div>
  );
}

export default function GroupsPageClient({ groups }: { groups: GroupWithStats[] }) {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [estado, setEstado] = useState<'all' | 'battle' | 'upcoming' | 'none'>('all');
  const [sort, setSort] = useState<SortKey>('rank');
  const [view, setView] = useState<View>('grid');
  const [page, setPage] = useState(1);

  const genres = useMemo(
    () => Array.from(new Set(groups.map((g) => g.genre).filter((g): g is string => !!g))).sort(),
    [groups]
  );

  const counts = useMemo(
    () => ({
      battle: groups.filter((g) => g.battle_status === 'battle').length,
      upcoming: groups.filter((g) => g.battle_status === 'upcoming').length,
      none: groups.filter((g) => g.battle_status === 'none').length,
    }),
    [groups]
  );

  const genreCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of groups) {
      if (g.genre) map.set(g.genre, (map.get(g.genre) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    let rows = groups;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((g) => g.name.toLowerCase().includes(q) || g.fandom_name?.toLowerCase().includes(q));
    }
    if (genre !== 'all') rows = rows.filter((g) => g.genre === genre);
    if (estado !== 'all') rows = rows.filter((g) => g.battle_status === estado);

    rows = [...rows];
    if (sort === 'rank') rows.sort((a, b) => a.rank - b.rank);
    else if (sort === 'rank_desc') rows.sort((a, b) => b.rank - a.rank);
    else if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [groups, search, genre, estado, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const topRanking = useMemo(() => [...groups].sort((a, b) => a.rank - b.rank).slice(0, 5), [groups]);
  const featured = topRanking[0] ?? null;

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[10rem]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => updateFilter(() => setSearch(e.target.value))}
            className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={genre}
          onChange={(e) => updateFilter(() => setGenre(e.target.value))}
          className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todos los géneros</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => updateFilter(() => setEstado(e.target.value as typeof estado))}
          className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="battle">En batalla</option>
          <option value="upcoming">Próximamente</option>
          <option value="none">Sin batalla</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-2 text-sm"
        >
          <option value="rank">Ordenar: más puntos</option>
          <option value="rank_desc">Ordenar: menos puntos</option>
          <option value="name">Ordenar: nombre (A-Z)</option>
        </select>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white dark:bg-neutral-800 shadow' : 'text-neutral-400'}`}
            title="Vista de cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white dark:bg-neutral-800 shadow' : 'text-neutral-400'}`}
            title="Vista de lista"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_18rem] gap-6 items-start">
        {/* Columna principal */}
        <div className="space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" /> {estado === 'all' && genre === 'all' && !search ? 'Todos los grupos' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}
          </h2>

          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">No encontramos grupos con esos filtros.</p>
          ) : view === 'grid' ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pageRows.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pageRows.map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-neutral-500">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-amber-500" /> Top ranking
            </h3>
            <div className="space-y-2">
              {topRanking.map((g) => (
                <Link key={g.id} href={`/grupo/${g.slug}`} className="flex items-center gap-2 hover:opacity-80 transition">
                  <span className="text-xs font-bold text-neutral-400 w-4 shrink-0">{g.rank}</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                    <GroupImage image={g.image_url} name={g.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{g.name}</p>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">{g.total_points.toLocaleString('es-MX')} pts</span>
                </Link>
              ))}
            </div>
            <Link href="/estadisticas" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
              Ver ranking completo →
            </Link>
          </div>

          {genres.length > 0 && (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-2">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <Disc3 className="w-4 h-4 text-violet-500" /> Filtrar por género
              </h3>
              <button
                onClick={() => updateFilter(() => setGenre('all'))}
                className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${genre === 'all' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
              >
                Todos los géneros <span>{groups.length}</span>
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => updateFilter(() => setGenre(g))}
                  className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${genre === g ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
                >
                  {g} <span>{genreCounts.get(g)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <Flag className="w-4 h-4 text-pink-500" /> Estado
            </h3>
            <button
              onClick={() => updateFilter(() => setEstado('battle'))}
              className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${estado === 'battle' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
            >
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> En batalla</span> {counts.battle}
            </button>
            <button
              onClick={() => updateFilter(() => setEstado('upcoming'))}
              className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${estado === 'upcoming' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
            >
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Próximamente</span> {counts.upcoming}
            </button>
            <button
              onClick={() => updateFilter(() => setEstado('none'))}
              className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${estado === 'none' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
            >
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-400" /> Sin batalla</span> {counts.none}
            </button>
          </div>

          <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-2xl p-4 text-white space-y-2">
            <h3 className="font-bold text-sm">¡Registra tu grupo!</h3>
            <p className="text-xs text-white/90">¿Tu grupo favorito no está en la lista? Envía tu solicitud y ayúdanos a sumarlo.</p>
            <Link
              href="/reclamar"
              className="inline-block bg-white text-violet-600 text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition"
            >
              Registrar grupo
            </Link>
          </div>
        </div>
      </div>

      {/* Grupo destacado */}
      {featured && (
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-xl overflow-hidden shrink-0">
            <GroupImage image={featured.image_url} name={featured.name} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wide">
              <Trophy className="w-3.5 h-3.5" /> Grupo destacado — #1 del ranking
            </p>
            <h3 className="text-xl font-black flex items-center gap-1.5">
              {featured.name}
              <BadgeCheck className="w-4 h-4 text-violet-500" />
            </h3>
            <p className="text-xs text-neutral-500">{featured.agency ?? 'Agencia sin registrar'}</p>
            {featured.bio && <p className="text-sm text-neutral-600 dark:text-neutral-400">{featured.bio}</p>}
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {featured.total_points.toLocaleString('es-MX')} puntos este mes
            </p>
            <Link
              href={`/grupo/${featured.slug}`}
              className="inline-block bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-lg transition"
            >
              Ver perfil completo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
