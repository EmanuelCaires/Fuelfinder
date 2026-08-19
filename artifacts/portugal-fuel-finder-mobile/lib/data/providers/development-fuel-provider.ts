import type {
  FuelProviderResult,
  FuelStationProvider,
  FuelStationQuery,
  FuelStationRecord,
} from '../types';
import { haversineKm } from '../geo';

const DEVELOPMENT_STATIONS: FuelStationRecord[] = [
  {
    id: 'dev-prio-valongo',
    name: 'PRIO Valongo',
    brand: 'PRIO',
    place: 'Valongo',
    latitude: 41.1888,
    longitude: -8.4929,
    diesel: 1.579,
    petrol: 1.669,
    updatedAt: new Date().toISOString(),
    source: 'development',
  },
  {
    id: 'dev-intermarche-ermesinde',
    name: 'Intermarché Ermesinde',
    brand: 'Intermarché',
    place: 'Ermesinde',
    latitude: 41.2145,
    longitude: -8.5530,
    diesel: 1.594,
    petrol: 1.674,
    updatedAt: new Date().toISOString(),
    source: 'development',
  },
  {
    id: 'dev-galp-rio-tinto',
    name: 'GALP Rio Tinto',
    brand: 'GALP',
    place: 'Rio Tinto',
    latitude: 41.1806,
    longitude: -8.5584,
    diesel: 1.689,
    petrol: 1.779,
    updatedAt: new Date().toISOString(),
    source: 'development',
  },
];

export class DevelopmentFuelProvider implements FuelStationProvider {
  readonly id = 'development' as const;
  readonly name = 'Dados de desenvolvimento';

  async nearby(query: FuelStationQuery): Promise<FuelProviderResult> {
    const radiusKm = query.radiusKm ?? 60;

    const stations = DEVELOPMENT_STATIONS.filter(
      station =>
        haversineKm(
          query.latitude,
          query.longitude,
          station.latitude,
          station.longitude,
        ) <= radiusKm,
    );

    return {
      stations,
      source: 'development',
      fetchedAt: new Date().toISOString(),
    };
  }
}
