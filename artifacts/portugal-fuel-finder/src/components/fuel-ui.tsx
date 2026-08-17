import { Link, useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Fuel,
  Gauge,
  Map,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Utensils,
  Zap,
} from 'lucide-react';
import type { FuelSummary, Station } from '@workspace/api-client-react';

export type FuelMode = 'petrol' | 'diesel' | 'electric';

export const fuelLabel: Record<FuelMode, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
};

export const fuelShortLabel: Record<FuelMode, string> = {
  petrol: '95',
  diesel: 'Diesel',
  electric: 'EV',
};

export function formatPrice(value: number | null | undefined, mode: FuelMode = 'petrol') {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(3)} €${mode === 'electric' ? '/kWh' : '/L'}`;
}

export function formatTimeAgo(value?: string) {
  if (!value) return 'Freshness unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently checked';
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 3) return 'Updated just now';
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

export function getStationPrice(station: Station, mode: FuelMode) {
  return mode === 'petrol'
    ? station.petrolPrice
    : mode === 'diesel'
      ? station.dieselPrice
      : station.evPricePerKwh;
}

export function AppMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${compact ? '' : 'group'}`} data-testid="link-brand">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-[0_7px_0_hsl(214_48%_10%/.22)] transition-transform duration-200 group-hover:-rotate-3">
        <Fuel size={20} strokeWidth={2.8} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--sidebar))] bg-[hsl(var(--accent))]" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="font-display block text-[17px] font-bold tracking-[-.04em] text-[hsl(var(--sidebar-foreground))]">Fuel Finder</span>
          <span className="mt-1 block font-mono-ui text-[9px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.55)]">Portugal / on the road</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const navItems = [
    { href: '/', label: 'Find a station', icon: Compass, exact: location === '/' },
    { href: '/regions', label: 'Regions & prices', icon: BarChart3, exact: location === '/regions' },
  ];
  return (
    <div className="app-shell noise flex flex-col lg:flex-row">
      <aside className="hidden min-h-[100dvh] w-[258px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-5 py-7 lg:flex">
        <AppMark />
        <div className="mt-14">
          <p className="px-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.42)]">Navigation</p>
          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                  className={`tap-target flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${item.exact ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.58)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`}
                >
                  <Icon size={18} strokeWidth={item.exact ? 2.5 : 2} />
                  {item.label}
                  {item.exact && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.65)] p-4">
          <ShieldCheck size={19} className="text-[hsl(var(--accent))]" />
          <p className="mt-4 font-display text-lg font-semibold leading-tight text-[hsl(var(--sidebar-foreground))]">Prices with a timestamp.</p>
          <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--sidebar-foreground)/.54)]">A calmer way to decide before you pull in. Always check the pump display too.</p>
        </div>
        <p className="mt-5 px-1 font-mono-ui text-[9px] uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.34)]">Independent comparison / PT</p>
      </aside>
      <header className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] px-5 py-4 backdrop-blur-md lg:hidden">
        <AppMark compact />
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-lg p-2.5 ${item.exact ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`link-mobile-nav-${item.href === '/' ? 'home' : 'regions'}`}>
              <item.icon size={18} />
            </Link>
          ))}
        </div>
      </header>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export function FuelModeTabs({ value, onChange }: { value: FuelMode; onChange: (value: FuelMode) => void }) {
  const modes: { value: FuelMode; icon: typeof Fuel }[] = [
    { value: 'petrol', icon: Fuel },
    { value: 'diesel', icon: Gauge },
    { value: 'electric', icon: Zap },
  ];
  return (
    <div className="flex rounded-xl bg-[hsl(var(--muted)/.8)] p-1" role="tablist" aria-label="Fuel type">
      {modes.map(({ value: mode, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          data-testid={`button-fuel-${mode}`}
          className={`tap-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${value === mode ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          <Icon size={15} />
          <span>{fuelLabel[mode]}</span>
        </button>
      ))}
    </div>
  );
}

export function PriceReadout({ station, mode, large = false }: { station: Station; mode: FuelMode; large?: boolean }) {
  const price = getStationPrice(station, mode);
  return (
    <div>
      <span className={`price-mark font-mono-ui font-bold text-[hsl(var(--foreground))] ${large ? 'text-3xl' : 'text-xl'}`}>{price == null ? '—' : price.toFixed(3)}</span>
      {price != null && <span className="ml-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{mode === 'electric' ? '€/kWh' : '€/L'}</span>}
    </div>
  );
}

export function StationCard({ station, mode, index = 0 }: { station: Station; mode: FuelMode; index?: number }) {
  const amenities = station.amenities ?? [];
  return (
    <Link
      href={`/station/${station.id}`}
      className="station-card page-enter group block rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-xs)]"
      style={{ animationDelay: `${index * 55}ms` }}
      data-testid={`card-station-${station.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[hsl(var(--secondary))] px-2 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-[.12em] text-[hsl(var(--secondary-foreground))]">{station.brand}</span>
            {station.rankingLabel && <span className="flex items-center gap-1 rounded-md bg-[hsl(var(--accent)/.28)] px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[hsl(var(--accent-foreground))]"><Sparkles size={10} /> {station.rankingLabel}</span>}
          </div>
          <h3 className="truncate font-display text-[19px] font-semibold tracking-[-.025em] text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--ring))]">{station.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={13} /> {station.address}, {station.city}</p>
        </div>
        <div className="shrink-0 text-right">
          <PriceReadout station={station} mode={mode} />
          <p className="mt-1 font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">{station.distanceKm == null ? '—' : `${station.distanceKm.toFixed(1)} km`}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {station.open24Hours && <span className="flex items-center gap-1 text-[10px] font-semibold text-[hsl(165_48%_38%)]"><Clock3 size={12} /> Open 24h</span>}
          {station.evPowerKw != null && <span className="flex items-center gap-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]"><Zap size={12} /> {station.evPowerKw} kW</span>}
          {amenities.length > 0 && <span className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">+ {amenities.length} amenit{amenities.length === 1 ? 'y' : 'ies'}</span>}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[hsl(var(--foreground))]">Inspect <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

export function StationListSkeleton() {
  return <div className="space-y-3" aria-label="Loading stations" data-testid="loading-stations">{[1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4"><div className="skeleton h-3 w-20 rounded" /><div className="skeleton mt-4 h-5 w-2/3 rounded" /><div className="skeleton mt-2 h-3 w-1/2 rounded" /><div className="mt-5 flex justify-between"><div className="skeleton h-3 w-28 rounded" /><div className="skeleton h-3 w-16 rounded" /></div></div>)}</div>;
}

export function QueryError({ message = 'We could not load this view.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-6 text-center" role="alert" data-testid="status-error">
      <AlertTriangle className="mx-auto text-[hsl(var(--destructive))]" size={22} />
      <p className="mt-3 font-display text-lg font-semibold">{message}</p>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try again in a moment. The road is still here.</p>
      {onRetry && <button type="button" onClick={onRetry} className="tap-target mt-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--foreground))] px-4 py-2 text-xs font-bold text-[hsl(var(--card))]" data-testid="button-retry"><RefreshCw size={14} /> Retry</button>}
    </div>
  );
}

export function EmptyStations({ search }: { search?: string }) {
  return <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] px-6 py-12 text-center" data-testid="status-empty-stations"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[hsl(var(--secondary))]"><MapPin size={22} /></div><h3 className="mt-4 font-display text-xl font-semibold">No stations in that radius</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{search ? `Nothing matched “${search}”. Try a nearby town or widen the radius.` : 'Try searching for a Portuguese town or choosing a wider radius.'}</p></div>;
}

export function MapPanel({ stations, mode }: { stations: Station[]; mode: FuelMode }) {
  const points = stations.slice(0, 8);
  return (
    <div className="road-map relative min-h-[310px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] shadow-[var(--shadow-xs)] lg:min-h-[540px]" data-testid="panel-station-map">
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 600 500" fill="none" aria-hidden="true">
        <path d="M-50 380C80 280 105 340 190 255S340 245 398 165 530 130 660 65" stroke="hsl(191 70% 42% / .55)" strokeWidth="5" />
        <path d="M-10 90C90 110 142 175 245 155S390 55 620 210" stroke="hsl(26 88% 62% / .42)" strokeWidth="3" />
        <path className="route-line" d="M50 440C160 350 215 300 310 310S420 215 520 190" stroke="hsl(214 48% 16% / .45)" strokeWidth="2" />
      </svg>
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-[hsl(var(--card)/.9)] px-3 py-2 text-[10px] font-bold text-[hsl(var(--foreground))] shadow-sm backdrop-blur">
        <Map size={13} /> LIVE AREA VIEW
      </div>
      <div className="absolute bottom-4 left-4 rounded-lg bg-[hsl(var(--card)/.9)] px-3 py-2 font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))] shadow-sm backdrop-blur">Portugal / {points.length} plotted</div>
      {points.map((station, index) => {
        const x = 14 + ((index * 37) % 72);
        const y = 23 + ((index * 53) % 58);
        return <Link key={station.id} href={`/station/${station.id}`} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} data-testid={`link-map-station-${station.id}`}><span className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--primary))] text-[hsl(var(--accent))] shadow-lg transition-transform group-hover:scale-125"><Fuel size={13} fill="currentColor" /><span className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[hsl(var(--primary))] px-2 py-1 font-mono-ui text-[9px] text-[hsl(var(--primary-foreground))] group-hover:block">{getStationPrice(station, mode)?.toFixed(3) ?? '—'} €</span></span></Link>;
      })}
      {points.length === 0 && <div className="absolute inset-0 grid place-items-center"><div className="rounded-xl bg-[hsl(var(--card)/.9)] px-4 py-3 text-sm font-semibold shadow-sm">Map will fill when stations arrive</div></div>}
    </div>
  );
}

export function SummaryStrip({ summary, loading }: { summary?: FuelSummary; loading: boolean }) {
  const items = summary ? [
    { label: 'Petrol average', price: summary.averagePetrol, icon: Fuel },
    { label: 'Diesel average', price: summary.averageDiesel, icon: Gauge },
    { label: 'EV average', price: summary.averageEv, icon: Zap },
  ] : [];
  return (
    <section className="grid gap-3 sm:grid-cols-3" data-testid="summary-strip">
      {loading ? [1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton mt-3 h-8 w-24 rounded" /></div>) : items.map(({ label, price, icon: Icon }) => <div key={label} className="group rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-xs)] transition-transform hover:-translate-y-0.5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">{label}</span><Icon size={15} className="text-[hsl(var(--ring))]" /></div><p className="mt-2 font-mono-ui text-2xl font-bold tracking-[-.06em]">{price.toFixed(3)} <span className="text-[10px] font-normal tracking-normal text-[hsl(var(--muted-foreground))]">{label.startsWith('EV') ? '€/kWh' : '€/L'}</span></p></div>)}
    </section>
  );
}

export function HeaderIntro({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="page-enter"><p className="flex items-center gap-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--ring))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" /> {eyebrow}</p><h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[.98] tracking-[-.06em] text-[hsl(var(--foreground))] sm:text-6xl">{title}</h1><p className="mt-5 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{detail}</p></div>;
}

export function DirectionsButton({ station }: { station: Station }) {
  const href = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  return <a href={href} target="_blank" rel="noreferrer" className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-[0_4px_0_hsl(214_48%_10%/.18)] hover:-translate-y-0.5" data-testid={`link-directions-${station.id}`}><Navigation size={15} /> Directions <ExternalLink size={12} /></a>;
}

export function QuickFact({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.7)] p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--ring))]"><Icon size={16} /></span><span><span className="block text-[10px] text-[hsl(var(--muted-foreground))]">{label}</span><span className="mt-0.5 block text-xs font-bold">{value}</span></span></div>;
}

export function AmenityIcon({ amenity }: { amenity: string }) {
  const lower = amenity.toLowerCase();
  if (lower.includes('shop') || lower.includes('store')) return <Store size={15} />;
  if (lower.includes('food') || lower.includes('cafe') || lower.includes('restaurant')) return <Utensils size={15} />;
  if (lower.includes('wash') || lower.includes('water')) return <Sparkles size={15} />;
  return <Check size={15} />;
}

export function Leaders({ summary }: { summary?: FuelSummary }) {
  if (!summary) return null;
  const leaders = [
    { label: 'Cheapest petrol', leader: summary.cheapestPetrol, icon: Fuel },
    { label: 'Cheapest diesel', leader: summary.cheapestDiesel, icon: Gauge },
    { label: 'Cheapest EV', leader: summary.cheapestEv, icon: Zap },
  ];
  return <div className="divide-y divide-[hsl(var(--border))]">{leaders.map(({ label, leader, icon: Icon }) => <Link key={label} href={`/station/${leader.stationId}`} className="tap-target flex items-center gap-3 py-3 first:pt-0 last:pb-0" data-testid={`link-leader-${leader.stationId}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--ring))]"><Icon size={15} /></span><span className="min-w-0 flex-1"><span className="block text-[10px] text-[hsl(var(--muted-foreground))]">{label}</span><span className="mt-0.5 block truncate text-xs font-bold">{leader.stationName} <span className="font-normal text-[hsl(var(--muted-foreground))]">· {leader.city}</span></span></span><span className="font-mono-ui text-sm font-bold">{leader.price.toFixed(3)}</span><ArrowRight size={14} className="text-[hsl(var(--muted-foreground))]" /></Link>)}</div>;
}