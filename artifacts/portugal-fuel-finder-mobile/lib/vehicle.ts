import AsyncStorage from '@react-native-async-storage/async-storage';

export type VehicleEnergyType = 'diesel' | 'petrol' | 'electric' | 'phev';

export type VehicleV2 = {
  version: 2;
  name: string;
  make?: string;
  model?: string;
  registration?: string;
  energyType: VehicleEnergyType;

  // Combustion fields
  tankLitres?: number;
  fuelConsumptionLPer100Km?: number;

  // Electric fields
  batteryKWh?: number;
  electricConsumptionKWhPer100Km?: number;

  // PHEV-specific convenience
  preferredMode?: 'fuel' | 'electric';
};

const VEHICLE_KEY = 'fuelfinder:vehicle:v1';

type LegacyVehicle = {
  name: string;
  make?: string;
  model?: string;
  registration?: string;
  fuel?: 'diesel' | 'petrol';
  tankLitres?: number;
  consumption?: number;
};

function migrateLegacy(vehicle: LegacyVehicle): VehicleV2 {
  return {
    version: 2,
    name: vehicle.name || 'Meu carro',
    make: vehicle.make,
    model: vehicle.model,
    registration: vehicle.registration,
    energyType: vehicle.fuel === 'petrol' ? 'petrol' : 'diesel',
    tankLitres: vehicle.tankLitres ?? 50,
    fuelConsumptionLPer100Km: vehicle.consumption ?? 6.5,
  };
}

export async function getVehicle(): Promise<VehicleV2 | null> {
  try {
    const raw = await AsyncStorage.getItem(VEHICLE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.version === 2) return parsed as VehicleV2;

    const migrated = migrateLegacy(parsed as LegacyVehicle);
    await saveVehicle(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export async function saveVehicle(vehicle: VehicleV2) {
  await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
}

export async function removeVehicle() {
  await AsyncStorage.removeItem(VEHICLE_KEY);
}

export function vehiclePrimaryEnergy(vehicle: VehicleV2 | null): 'diesel' | 'petrol' | 'electric' {
  if (!vehicle) return 'diesel';
  if (vehicle.energyType === 'phev') {
    return vehicle.preferredMode === 'electric' ? 'electric' : 'petrol';
  }
  return vehicle.energyType;
}
