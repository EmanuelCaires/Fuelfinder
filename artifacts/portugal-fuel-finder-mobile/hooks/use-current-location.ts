import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type CurrentLocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  label: string | null;
  status: 'loading' | 'ready' | 'denied' | 'error';
  error: string | null;
};

const initialState: CurrentLocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  label: null,
  status: 'loading',
  error: null,
};

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocationState>(initialState);

  const refresh = useCallback(async () => {
    setLocation(current => ({ ...current, status: 'loading', error: null }));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocation({
          ...initialState,
          status: 'denied',
          error: 'Ativa a localização para encontrar os postos mais próximos.',
        });
        return;
      }

      let position = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 500 });
      if (!position) {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      const { latitude, longitude, accuracy } = position.coords;
      let label: string | null = null;

      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          label = address.city || address.subregion || address.region || address.country || null;
        }
      } catch {
        // Coordinates are still useful if reverse geocoding is temporarily unavailable.
      }

      setLocation({
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        label,
        status: 'ready',
        error: null,
      });
    } catch {
      setLocation({
        ...initialState,
        status: 'error',
        error: 'Não foi possível obter a tua localização. Tenta novamente.',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...location, refresh };
}
