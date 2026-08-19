import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizeDataError, type FuelFinderDataError } from '../lib/data/errors';
import { haversineKm } from '../lib/data/geo';
import { createFuelProvider } from '../lib/data/provider-registry';
import type { NearbyFuelStation } from '../lib/data/types';

const provider = createFuelProvider();

type UseFuelStationsOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export function useFuelStationsV2({
  latitude,
  longitude,
  radiusKm = 60,
}: UseFuelStationsOptions) {
  const [stations, setStations] = useState<NearbyFuelStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FuelFinderDataError | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (latitude == null || longitude == null) return;

    setLoading(true);
    setError(null);

    try {
      const result = await provider.nearby({
        latitude,
        longitude,
        radiusKm,
      });

      const nearby = result.stations
        .map(station => ({
          ...station,
          distanceKm: haversineKm(
            latitude,
            longitude,
            station.latitude,
            station.longitude,
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setStations(nearby);
      setLastUpdatedAt(result.fetchedAt);
    } catch (caught) {
      setError(normalizeDataError(caught));
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusKm]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasData = stations.length > 0;

  return useMemo(
    () => ({
      stations,
      loading,
      error,
      hasData,
      lastUpdatedAt,
      providerId: provider.id,
      providerName: provider.name,
      refresh,
    }),
    [stations, loading, error, hasData, lastUpdatedAt, refresh],
  );
}
