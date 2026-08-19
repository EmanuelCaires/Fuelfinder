
export type FuelKind = 'diesel' | 'petrol';

export type Station = {
  id: string;
  name: string;
  brand: string;
  place: string;
  latitude: number;
  longitude: number;
  diesel: number;
  petrol: number;
  updatedAt: string;
  source: 'development' | 'dgeg';
};

export type NearbyStation = Station & {
  distanceKm: number;
};

export interface StationProvider {
  nearby(latitude: number, longitude: number, radiusKm?: number): Promise<Station[]>;
}

export const DEVELOPMENT_STATIONS: Station[] = [
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

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class DevelopmentStationProvider implements StationProvider {
  async nearby(latitude: number, longitude: number, radiusKm = 50) {
    return DEVELOPMENT_STATIONS.filter(
      station => haversineKm(latitude, longitude, station.latitude, station.longitude) <= radiusKm,
    );
  }
}

export async function getNearbyStations(
  provider: StationProvider,
  latitude: number,
  longitude: number,
  radiusKm = 50,
): Promise<NearbyStation[]> {
  const stations = await provider.nearby(latitude, longitude, radiusKm);
  return stations
    .map(station => ({
      ...station,
      distanceKm: haversineKm(latitude, longitude, station.latitude, station.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function rankByRealSaving(
  stations: NearbyStation[],
  fuel: FuelKind,
  tankLitres: number,
  consumptionLPer100Km: number,
) {
  if (!stations.length) return [];
  const average = stations.reduce((sum, station) => sum + station[fuel], 0) / stations.length;

  return stations
    .map(station => {
      const grossSaving = Math.max(0, (average - station[fuel]) * tankLitres);
      const travelFuelLitres = (station.distanceKm * 2 / 100) * consumptionLPer100Km;
      const travelCost = travelFuelLitres * station[fuel];
      const realSaving = Math.max(0, grossSaving - travelCost);
      return { ...station, grossSaving, travelCost, realSaving };
    })
    .sort((a, b) => b.realSaving - a.realSaving);
}


export function getStationById(id: string): Station | undefined {
  return DEVELOPMENT_STATIONS.find(station => station.id === id);
}
