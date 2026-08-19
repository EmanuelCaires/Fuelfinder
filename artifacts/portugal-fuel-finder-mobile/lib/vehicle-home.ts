import type { VehicleV2 } from './vehicle';

export function homeFuelMode(vehicle: VehicleV2 | null): 'diesel' | 'petrol' {
  if (!vehicle) return 'diesel';

  if (vehicle.energyType === 'diesel') return 'diesel';
  if (vehicle.energyType === 'petrol') return 'petrol';

  // PHEV fuel mode is petrol for the current fuel-price experience.
  if (vehicle.energyType === 'phev' && vehicle.preferredMode !== 'electric') return 'petrol';

  // EV and electric-first PHEV are not connected to charger data yet.
  return 'petrol';
}

export function combustionTankLitres(vehicle: VehicleV2 | null): number {
  return vehicle?.tankLitres && vehicle.tankLitres > 0 ? vehicle.tankLitres : 50;
}

export function combustionConsumption(vehicle: VehicleV2 | null): number {
  return vehicle?.fuelConsumptionLPer100Km && vehicle.fuelConsumptionLPer100Km > 0
    ? vehicle.fuelConsumptionLPer100Km
    : 6.5;
}

export function vehicleSummary(vehicle: VehicleV2 | null): string {
  if (!vehicle) return 'Personaliza a tua poupança';

  if (vehicle.energyType === 'electric') {
    return `${vehicle.batteryKWh ?? 0} kWh · ${vehicle.electricConsumptionKWhPer100Km ?? 0} kWh/100 km`;
  }

  if (vehicle.energyType === 'phev') {
    return `PHEV · ${vehicle.tankLitres ?? 0} L + ${vehicle.batteryKWh ?? 0} kWh`;
  }

  return `${vehicle.energyType === 'diesel' ? 'Diesel' : 'Gasolina'} · ${vehicle.tankLitres ?? 0} L · ${vehicle.fuelConsumptionLPer100Km ?? 0} L/100 km`;
}
