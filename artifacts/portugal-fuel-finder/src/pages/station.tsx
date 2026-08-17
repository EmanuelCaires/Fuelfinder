import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, Clock3, Fuel, Gauge, Info, MapPin, Navigation, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getGetStationQueryKey, useGetStation } from '@workspace/api-client-react';
import {
  AmenityIcon,
  DirectionsButton,
  EmptyStations,
  formatTimeAgo,
  FuelModeTabs,
  QueryError,
  QuickFact,
  type FuelMode,
} from '@/components/fuel-ui';

export default function StationPage() {
  const params = useParams<{ stationId: string }>();
  const stationId = params.stationId ?? '';
  const [mode, setMode] = useState<FuelMode>('petrol');
  const stationQuery = useGetStation(stationId, { query: { enabled: Boolean(stationId), queryKey: getGetStationQueryKey(stationId) } });
  const station = stationQuery.data;

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto max-w-[1120px] px-4 pb-12 sm:px-7 lg:px-10 lg:py-12">
        <div className="mb-8 pt-6 lg:pt-0"><Link href="/" className="tap-target inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-back-home"><ArrowLeft size={15} /> Back to comparison</Link></div>
        {stationQuery.isLoading && <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="skeleton h-[430px] rounded-[26px]" /><div className="skeleton h-[320px] rounded-[26px]" /></div>}
        {stationQuery.isError && <div className="mx-auto max-w-lg py-20"><QueryError message="This station is out of reach." onRetry={() => stationQuery.refetch()} /></div>}
        {!stationQuery.isLoading && !stationQuery.isError && !station && <div className="mx-auto max-w-lg py-20"><EmptyStations /></div>}
        {station && (
          <div className="page-enter">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_340px]">
              <section className="overflow-hidden rounded-[26px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-[var(--shadow)]">
                <div className="relative bg-[hsl(var(--primary))] px-5 py-7 text-[hsl(var(--primary-foreground))] sm:px-8 sm:py-9">
                  <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-[hsl(var(--accent)/.18)]" />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[hsl(var(--primary-foreground)/.12)] px-2 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-[.14em]">{station.brand}</span>{station.rankingLabel && <span className="rounded-md bg-[hsl(var(--accent))] px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[hsl(var(--accent-foreground))]">{station.rankingLabel}</span>}</div>
                    <h1 className="mt-5 max-w-xl font-display text-4xl font-bold leading-[.95] tracking-[-.06em] sm:text-6xl">{station.name}</h1>
                    <p className="mt-4 flex items-start gap-2 text-sm text-[hsl(var(--primary-foreground)/.72)]"><MapPin size={16} className="mt-0.5 shrink-0" /> {station.address}, {station.city}<span className="opacity-40">·</span>{station.district}</p>
                  </div>
                </div>
                <div className="p-5 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Current prices</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatTimeAgo(station.updatedAt)}</p></div><FuelModeTabs value={mode} onChange={setMode} /></div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <PriceBlock label="Petrol" value={station.petrolPrice} active={mode === 'petrol'} icon={Fuel} unit="€/L" />
                    <PriceBlock label="Diesel" value={station.dieselPrice} active={mode === 'diesel'} icon={Gauge} unit="€/L" />
                    <PriceBlock label="EV charge" value={station.evPricePerKwh} active={mode === 'electric'} icon={Zap} unit="€/kWh" />
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3"><QuickFact icon={Navigation} label="Distance" value={station.distanceKm == null ? 'Distance unknown' : `${station.distanceKm.toFixed(1)} km away`} /><QuickFact icon={Clock3} label="Opening" value={station.open24Hours ? 'Open 24 hours' : 'Hours may vary'} /><QuickFact icon={Zap} label="Charger" value={station.evPowerKw == null ? 'No EV power listed' : `${station.evPowerKw} kW available`} /></div>
                  <div className="mt-7 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck size={15} className="text-[hsl(165_48%_38%)]" /> Price reported {formatTimeAgo(station.updatedAt).toLowerCase()}</span><DirectionsButton station={station} /></div>
                </div>
              </section>
              <aside className="space-y-5">
                <div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-xs)] sm:p-6">
                  <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold tracking-[-.04em]">What’s here</h2><Sparkles size={18} className="text-[hsl(var(--ring))]" /></div>
                  {station.amenities.length > 0 ? <div className="mt-5 space-y-2">{station.amenities.map((amenity) => <div key={amenity} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.65)] px-3 py-3 text-sm"><span className="text-[hsl(var(--ring))]"><AmenityIcon amenity={amenity} /></span><span>{amenity}</span><Check size={14} className="ml-auto text-[hsl(165_48%_38%)]" /></div>)}</div> : <p className="mt-5 rounded-xl bg-[hsl(var(--muted)/.65)] p-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">No amenities have been listed for this station yet.</p>}
                </div>
                <div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--secondary)/.55)] p-5 sm:p-6"><div className="flex gap-3"><Info size={18} className="mt-0.5 shrink-0 text-[hsl(var(--ring))]" /><div><h2 className="font-display text-lg font-semibold">A small note for the road</h2><p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">Prices can move during the day. This listing helps you choose; the pump display is the final word.</p></div></div></div>
              </aside>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Station reference / {station.id}</p><Link href="/" className="tap-target inline-flex items-center gap-2 text-xs font-bold" data-testid="link-find-another">Find another station <ArrowLeft size={14} className="rotate-180" /></Link></div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceBlock({ label, value, active, icon: Icon, unit }: { label: string; value: number | null; active: boolean; icon: typeof Fuel; unit: string }) {
  return <div className={`rounded-2xl border p-4 transition-colors ${active ? 'border-[hsl(var(--ring)/.5)] bg-[hsl(var(--secondary)/.65)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}><div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]"><Icon size={14} className={active ? 'text-[hsl(var(--ring))]' : ''} />{label}</div><p className="mt-3 font-mono-ui text-2xl font-bold tracking-[-.06em]">{value == null ? '—' : value.toFixed(3)}{value != null && <span className="ml-1 text-[9px] font-normal tracking-normal text-[hsl(var(--muted-foreground))]">{unit}</span>}</p></div>;
}