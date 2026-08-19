import type { FuelStationProvider } from './types';
import { DevelopmentFuelProvider } from './providers/development-fuel-provider';
import { DgegFuelProvider } from './providers/dgeg-fuel-provider';
import { PendingEvChargingProvider } from './providers/ev-charging-provider';

const requestedFuelProvider =
  process.env.EXPO_PUBLIC_FUEL_PROVIDER === 'dgeg'
    ? 'dgeg'
    : 'development';

export function createFuelProvider(): FuelStationProvider {
  if (requestedFuelProvider === 'dgeg') {
    return new DgegFuelProvider({
      baseUrl: process.env.EXPO_PUBLIC_DGEG_API_URL,
      token: process.env.EXPO_PUBLIC_DGEG_API_TOKEN,
    });
  }

  return new DevelopmentFuelProvider();
}

export function createEvProvider() {
  return new PendingEvChargingProvider();
}

export function currentFuelProviderName() {
  return requestedFuelProvider === 'dgeg' ? 'DGEG' : 'Desenvolvimento';
}
