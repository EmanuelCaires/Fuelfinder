import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { LocateFixed, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import {
  getGetFuelSummaryQueryKey,
  getListStationsQueryKey,
  useGetFuelSummary,
  useListStations,
} from '@workspace/api-client-react';
import {
  EmptyStations,
  FuelModeTabs,
  HeaderIntro,
  Leaders,
  MapPanel,
  QueryError,
  StationCard,
  StationListSkeleton,
  SummaryStrip,
  type FuelMode,
} from '@/components/fuel-ui';

export default function Home() {
  const [mode, setMode] = useState<FuelMode>('petrol');
  const [draftSearch, setDraftSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [radius, setRadius] = useState('15');
  const [sort, setSort] = useState<'best' | 'price' | 'distance'>('best');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>();
  const [locationMessage, setLocationMessage] = useState('');

  const params = useMemo(() => ({
    fuelType: mode === 'electric' ? 'electric' as const : mode,
    ...(activeSearch ? { search: activeSearch } : {}),
    ...(coordinates ?? {}),
    ...(coordinates ? { maxDistanceKm: Number(radius) } : {}),
    sort,
  }), [activeSearch, coordinates, mode, radius, sort]);
  const stationQuery = useListStations(params, { query: { queryKey: getListStationsQueryKey(params) } });
  const summaryQuery = useGetFuelSummary({ query: { queryKey: getGetFuelSummaryQueryKey() } });
  const stations = stationQuery.data ?? [];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveSearch(draftSearch.trim());
    setCoordinates(undefined);
    setLocationMessage('');
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser.');
      return;
    }
    setLocationMessage('Finding stations near you…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setActiveSearch('');
        setDraftSearch('');
        setLocationMessage('Using your current position');
      },
      () => setLocationMessage('We could not access your location. Search for a town instead.'),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const searchLabel = coordinates ? 'Your current position' : activeSearch || 'Portugal';

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto max-w-[1540px] px-4 pb-10 sm:px-7 lg:px-10">
        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:py-12">
          <div className="min-w-0">
            <HeaderIntro eyebrow="A clearer stop, anywhere in Portugal" title="Find your next fuel stop before the warning light does." detail="Compare current petrol, diesel and EV prices around you or along the route. See the distance, the useful extras and how fresh the number is." />

            <section className="page-enter delay-1 relative mt-8 overflow-hidden rounded-[24px] bg-[hsl(var(--primary))] p-4 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-lg)] sm:p-6" data-testid="section-search">
              <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-[hsl(var(--accent)/.18)]" />
              <div className="pointer-events-none absolute -bottom-16 right-24 h-36 w-36 rounded-full border-[20px] border-[hsl(var(--accent)/.12)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.55)]">Start here</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">Where are you heading?</h2>
                  </div>
                  <div className="hidden rounded-full border border-[hsl(var(--primary-foreground)/.18)] px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[hsl(var(--primary-foreground)/.58)] sm:block">Live comparison</div>
                </div>
                <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row" data-testid="form-search">
                  <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-[hsl(var(--card))] px-4 py-3 text-[hsl(var(--foreground))] shadow-sm">
                    <Search size={18} className="shrink-0 text-[hsl(var(--ring))]" />
                    <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search town, city or district" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]" data-testid="input-search-place" />
                  </label>
                  <button type="submit" className="tap-target flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-5 py-3 text-sm font-bold text-[hsl(var(--accent-foreground))] shadow-[0_4px_0_hsl(73_75%_36%)] hover:-translate-y-0.5" data-testid="button-search"><Search size={16} /> Compare prices</button>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={useCurrentLocation} className="tap-target inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--primary-foreground)/.82)] hover:text-[hsl(var(--accent))]" data-testid="button-use-location"><LocateFixed size={14} /> Use my location</button>
                  <span className="hidden h-3 w-px bg-[hsl(var(--primary-foreground)/.25)] sm:block" />
                  <label className="flex items-center gap-2 text-xs text-[hsl(var(--primary-foreground)/.65)]"><span>Radius</span><select value={radius} onChange={(event) => setRadius(event.target.value)} className="rounded-md border border-[hsl(var(--primary-foreground)/.2)] bg-transparent px-2 py-1 text-xs font-semibold text-[hsl(var(--primary-foreground))] outline-none" data-testid="select-radius"><option value="5" className="text-[hsl(var(--foreground))]">5 km</option><option value="15" className="text-[hsl(var(--foreground))]">15 km</option><option value="30" className="text-[hsl(var(--foreground))]">30 km</option><option value="60" className="text-[hsl(var(--foreground))]">60 km</option></select></label>
                  {locationMessage && <span className="text-[10px] text-[hsl(var(--accent))]" data-testid="status-location">{locationMessage}</span>}
                </div>
              </div>
            </section>

            <div className="mt-8"><SummaryStrip summary={summaryQuery.data} loading={summaryQuery.isLoading} />{summaryQuery.isError && <p className="mt-2 text-[11px] text-[hsl(var(--destructive))]" data-testid="status-summary-error">Market averages are taking a pause. Station prices are still available below.</p>}</div>

            <section className="mt-10" data-testid="section-stations">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Around {searchLabel}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Worth the detour</h2>
                </div>
                <div className="flex items-center gap-2">
                  <FuelModeTabs value={mode} onChange={setMode} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]" data-testid="text-station-count">{stationQuery.isLoading ? 'Checking nearby stations…' : `${stations.length} station${stations.length === 1 ? '' : 's'} to compare`}</p>
                <label className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]"><SlidersHorizontal size={14} /><span className="hidden sm:inline">Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="bg-transparent text-xs font-bold text-[hsl(var(--foreground))] outline-none" data-testid="select-sort"><option value="best">Best match</option><option value="price">Lowest price</option><option value="distance">Closest first</option></select></label>
              </div>
              <div className="mt-4">
                {stationQuery.isLoading && <StationListSkeleton />}
                {stationQuery.isError && <QueryError onRetry={() => stationQuery.refetch()} />}
                {!stationQuery.isLoading && !stationQuery.isError && stations.length === 0 && <EmptyStations search={activeSearch} />}
                {!stationQuery.isLoading && !stationQuery.isError && stations.length > 0 && <div className="grid gap-3 xl:grid-cols-2">{stations.map((station, index) => <StationCard key={station.id} station={station} mode={mode} index={index} />)}</div>}
              </div>
            </section>
          </div>
          <aside className="page-enter delay-2 space-y-5 lg:pt-[290px]">
            <MapPanel stations={stations} mode={mode} />
            <div className="rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Portugal snapshot</p>{summaryQuery.data?.updatedAt && <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">As of {new Date(summaryQuery.data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}</div><span className="rounded-full bg-[hsl(var(--accent)/.25)] px-2 py-1 font-mono-ui text-[9px] font-bold text-[hsl(var(--accent-foreground))]">{summaryQuery.data?.stationsCount ?? '—'} stations</span></div>
              <div className="mt-4"><Leaders summary={summaryQuery.data} /></div>
              <Link href="/regions" className="tap-target mt-5 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-xs font-bold" data-testid="link-regions-from-home">See regional prices <span className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--secondary))]"><MapPin size={14} /></span></Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}