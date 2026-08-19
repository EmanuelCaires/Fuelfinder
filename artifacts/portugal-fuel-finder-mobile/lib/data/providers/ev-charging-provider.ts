import { FuelFinderDataError } from '../errors';
import type {
  EvChargerRecord,
  EvChargingProvider,
  FuelStationQuery,
} from '../types';

export class PendingEvChargingProvider implements EvChargingProvider {
  readonly id = 'ev' as const;
  readonly name = 'EV charging provider';

  async nearby(_query: FuelStationQuery): Promise<EvChargerRecord[]> {
    throw new FuelFinderDataError(
      'not-configured',
      'O fornecedor de carregamento elétrico ainda não está configurado.',
      false,
    );
  }
}
