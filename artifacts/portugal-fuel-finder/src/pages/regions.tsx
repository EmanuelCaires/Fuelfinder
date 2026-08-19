import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, BarChart3, Fuel, Gauge, MapPin, RefreshCw, Zap } from 'lucide-react';
import { getListRegionsQueryKey, useListRegions } from '@workspace/api-client-react';
import { formatPrice, HeaderIntro, QueryError, type FuelMode } from '@/components/fuel-ui';

export default function RegionsPage() {
  const [mode, setMode] = useState<FuelMode>('petrol');
  const regionsQuery = useListRegions({ query: { queryKey: getListRegionsQueryKey() } });
  const regions = regionsQuery.data ?? [];
  const values = useMemo(() => regions.map((region) => mode === 'petrol' ? region.cheapestPetrol : mode === 'diesel' ? region.cheapestDiesel : region.cheapestEv), [mode, regions]);
  const floor = values.length ? Math.min(...values) : 0;
  const ceiling = values.length ? Math.max(...values) : 1;

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-7 lg:px-10 lg:py-12">
        <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-14 lg:py-0">
          <div>
            <HeaderIntro eyebrow="See the wider picture" title="Where in Portugal is the tank happiest?" detail="A quick regional snapshot to help you spot price patterns before a long drive. These are the cheapest listed prices in each region, not a promise at every pump." />
            <div className="page-enter delay-1 mt-8 flex flex-col gap-3 rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--ring))]"><BarChart3 size={17} /></span><div><p className="text-sm font-bold">Compare by fuel</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">Lowest listed price per region</p></div></div><div className="flex rounded-xl bg-[hsl(var(--muted))] p-1">{(['petrol', 'diesel', 'electric'] as FuelMode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold sm:flex-none ${mode === item ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-region-fuel-${item}`}>{item === 'petrol' ? <Fuel size={13} /> : item === 'diesel' ? <Gauge size={13} /> : <Zap size={13} />}{item === 'electric' ? 'EV' : item[0].toUpperCase() + item.slice(1)}</button>)}</div></div>
            <section className="page-enter delay-2 mt-6 overflow-hidden rounded-[24px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-[var(--shadow-xs)]" data-testid="section-regions">
              <div className="hidden grid-cols-[1.4fr_.7fr_1fr_1fr] gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] px-5 py-3 font-mono-ui text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] sm:grid"><span>Region</span><span>Stations</span><span>Lowest</span><span>Relative range</span></div>
              {regionsQuery.isLoading && <div className="space-y-1 p-4" data-testid="loading-regions">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton h-16 rounded-xl" />)}</div>}
              {regionsQuery.isError && <div className="p-5"><QueryError message="Regional prices are taking a scenic route." onRetry={() => regionsQuery.refetch()} /></div>}
              {!regionsQuery.isLoading && !regionsQuery.isError && regions.length === 0 && <div className="p-10 text-center" data-testid="status-empty-regions"><MapPin className="mx-auto text-[hsl(var(--muted-foreground))]" /><p className="mt-3 font-display text-xl font-semibold">No regional snapshots yet</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Check back once the first prices arrive.</p></div>}
              {!regionsQuery.isLoading && !regionsQuery.isError && regions.map((region, index) => {
                const value = mode === 'petrol' ? region.cheapestPetrol : mode === 'diesel' ? region.cheapestDiesel : region.cheapestEv;
                const range = ceiling === floor ? 32 : 20 + ((value - floor) / (ceiling - floor)) * 70;
                return <div key={region.name} className="group grid gap-2 border-b border-[hsl(var(--border))] px-4 py-4 last:border-0 sm:grid-cols-[1.4fr_.7fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-5" data-testid={`row-region-${index}`}>
                  <div className="flex items-center gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono-ui text-[10px] font-bold ${index === 0 ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>{String(index + 1).padStart(2, '0')}</span><div><p className="text-sm font-bold">{region.name}</p><p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))] sm:hidden">{region.stationCount} stations</p></div></div>
                  <span className="hidden font-mono-ui text-xs text-[hsl(var(--muted-foreground))] sm:block">{region.stationCount}</span>
                  <span className="ml-11 font-mono-ui text-lg font-bold tracking-[-.06em] sm:ml-0">{formatPrice(value, mode)}</span>
                  <div className="ml-11 flex items-center gap-3 sm:ml-0"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className={`h-full rounded-full ${index === 0 ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--ring)/.55)]'}`} style={{ width: `${range}%` }} /></div><span className="hidden text-[10px] text-[hsl(var(--muted-foreground))] sm:block">{value === floor ? 'Lowest' : 'within range'}</span></div>
                </div>;
              })}
            </section>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><RefreshCw size={13} /> Snapshots update as station prices are refreshed.</p>
          </div>
          <aside className="space-y-5 lg:pt-[280px]">
            <div className="rounded-[22px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-lg)]"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.52)]">A useful shortcut</p><h2 className="mt-4 font-display text-3xl font-semibold leading-[.95] tracking-[-.05em]">Prices are a route decision.</h2><p className="mt-4 text-sm leading-relaxed text-[hsl(var(--primary-foreground)/.66)]">The cheapest pump is not always the best stop. Use the station view to balance price, distance and what you need on the way.</p><Link href="/" className="tap-target mt-6 flex items-center justify-between rounded-xl bg-[hsl(var(--accent))] px-4 py-3 text-xs font-bold text-[hsl(var(--accent-foreground))]" data-testid="link-regions-find-station">Find a station <ArrowRight size={15} /></Link></div>
            <div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-xs)]"><div className="flex items-center gap-2"><MapPin size={15} className="text-[hsl(var(--ring))]" /><p className="font-display text-lg font-semibold">Reading this table</p></div><p className="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">Regions are ordered by the current lowest price for {mode === 'electric' ? 'EV charging' : mode}. A longer bar means the regional floor sits higher than the lowest one.</p><div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]"><span className="h-2 w-8 rounded-full bg-[hsl(var(--accent))]" /> lowest listed <span className="ml-2 h-2 w-8 rounded-full bg-[hsl(var(--ring)/.55)]" /> other regions</div></div>
          </aside>
        </div>
      </div>
    </div>
  );
}