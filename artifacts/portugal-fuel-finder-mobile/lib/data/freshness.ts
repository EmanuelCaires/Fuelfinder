import type { DataFreshness, FuelStationRecord } from './types';

export function stationFreshness(
  station: FuelStationRecord,
  staleAfterMinutes = 180,
): DataFreshness {
  if (!station.updatedAt) return 'unknown';

  const timestamp = Date.parse(station.updatedAt);
  if (Number.isNaN(timestamp)) return 'unknown';

  const ageMinutes = (Date.now() - timestamp) / 60000;
  return ageMinutes > staleAfterMinutes ? 'stale' : 'fresh';
}

export function freshnessLabel(value: DataFreshness) {
  if (value === 'fresh') return 'Atualizado';
  if (value === 'stale') return 'Preço possivelmente desatualizado';
  return 'Hora de atualização indisponível';
}
