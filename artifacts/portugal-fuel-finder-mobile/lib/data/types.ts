export type FuelKind = 'diesel' | 'petrol';

export type DataSourceKind = 'development' | 'dgeg' | 'ev';

export type FuelStationRecord = {
  id: string;
  name: string;
  brand: string;
  place: string;
  latitude: number;
  longitude: number;
  diesel?: number;
  petrol?: number;
  updatedAt?: string;
  source: DataSourceKind;
};

export type NearbyFuelStation = FuelStationRecord & {
  distanceKm: number;
};

export type DataFreshness = 'fresh' | 'stale' | 'unknown';

export type FuelStationQuery = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

export type FuelProviderResult = {
  stations: FuelStationRecord[];
  source: DataSourceKind;
  fetchedAt: string;
};

export interface FuelStationProvider {
  readonly id: DataSourceKind;
  readonly name: string;
  nearby(query: FuelStationQuery): Promise<FuelProviderResult>;
}

export type ChargerConnector =
  | 'ccs'
  | 'type2'
  | 'chademo'
  | 'tesla'
  | 'unknown';

export type EvChargerRecord = {
  id: string;
  name: string;
  operator?: string;
  latitude: number;
  longitude: number;
  pricePerKWh?: number;
  maxPowerKw?: number;
  connectors?: ChargerConnector[];
  available?: boolean;
  updatedAt?: string;
  source: 'ev';
};

export interface EvChargingProvider {
  readonly id: 'ev';
  readonly name: string;
  nearby(query: FuelStationQuery): Promise<EvChargerRecord[]>;
}
