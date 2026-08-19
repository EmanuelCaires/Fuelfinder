# FuelFinder Data Provider v2

This layer separates FuelFinder UI from external data sources.

## Fuel providers

- `DevelopmentFuelProvider`: current test data.
- `DgegFuelProvider`: production adapter shell, intentionally waiting for the official DGEG API manual/schema.
- `PendingEvChargingProvider`: placeholder for a future EV charging data source.

## Switching providers

Local development:

```env
EXPO_PUBLIC_FUEL_PROVIDER=development
```

After DGEG access is confirmed:

```env
EXPO_PUBLIC_FUEL_PROVIDER=dgeg
EXPO_PUBLIC_DGEG_API_URL=...
EXPO_PUBLIC_DGEG_API_TOKEN=...
```

Do not guess DGEG endpoint paths or response fields. Update only
`lib/data/providers/dgeg-fuel-provider.ts` from their official documentation.

## Reliability states

`useFuelStationsV2` exposes:

- `loading`
- `error`
- `hasData`
- `lastUpdatedAt`
- `providerId`
- `providerName`
- `refresh`

`DataStateBanner` provides consistent loading, retry/error and stale-data UI.
