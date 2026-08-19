import { FuelFinderDataError } from '../errors';
import type {
  FuelProviderResult,
  FuelStationProvider,
  FuelStationQuery,
  FuelStationRecord,
} from '../types';

type DgegProviderOptions = {
  baseUrl?: string;
  token?: string;
};

export class DgegFuelProvider implements FuelStationProvider {
  readonly id = 'dgeg' as const;
  readonly name = 'DGEG';

  private baseUrl?: string;
  private token?: string;

  constructor(options: DgegProviderOptions = {}) {
    this.baseUrl = options.baseUrl;
    this.token = options.token;
  }

  async nearby(query: FuelStationQuery): Promise<FuelProviderResult> {
    if (!this.baseUrl || !this.token) {
      throw new FuelFinderDataError(
        'not-configured',
        'O acesso DGEG ainda não está configurado.',
        false,
      );
    }

    // IMPORTANT:
    // This endpoint/path is intentionally NOT guessed.
    // When DGEG provides the official manual/credentials, map the documented
    // request and response here. The rest of FuelFinder will not need changing.
    const url = new URL(this.baseUrl);
    url.searchParams.set('lat', String(query.latitude));
    url.searchParams.set('lon', String(query.longitude));
    url.searchParams.set('radiusKm', String(query.radiusKm ?? 60));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new FuelFinderDataError(
        'unauthorized',
        'As credenciais DGEG não foram aceites.',
        false,
      );
    }

    if (response.status === 429) {
      throw new FuelFinderDataError(
        'rate-limited',
        'O serviço DGEG está temporariamente limitado.',
        true,
      );
    }

    if (!response.ok) {
      throw new FuelFinderDataError(
        'network',
        `O serviço DGEG respondeu com ${response.status}.`,
        true,
      );
    }

    const payload = await response.json();

    // Replace this mapper only after receiving the official DGEG schema.
    if (!Array.isArray(payload?.stations)) {
      throw new FuelFinderDataError(
        'invalid-response',
        'A resposta DGEG não corresponde ao formato esperado.',
        false,
      );
    }

    const stations: FuelStationRecord[] = payload.stations.map((item: any) => ({
      id: String(item.id),
      name: String(item.name ?? item.brand ?? 'Posto'),
      brand: String(item.brand ?? 'Posto'),
      place: String(item.place ?? ''),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      diesel: item.diesel == null ? undefined : Number(item.diesel),
      petrol: item.petrol == null ? undefined : Number(item.petrol),
      updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
      source: 'dgeg',
    }));

    return {
      stations,
      source: 'dgeg',
      fetchedAt: new Date().toISOString(),
    };
  }
}
