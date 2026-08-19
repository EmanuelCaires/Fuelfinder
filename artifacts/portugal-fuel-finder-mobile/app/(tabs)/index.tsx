import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DataStateBanner } from '../../components/data-state-banner';
import { useFuelStationsV2 } from '../../hooks/use-fuel-stations-v2';
import { stationFreshness } from '../../lib/data/freshness';
import type { FuelKind, NearbyFuelStation } from '../../lib/data/types';
import { getVehicle, vehiclePrimaryEnergy, type VehicleV2 } from '../../lib/vehicle';
import {
  combustionConsumption,
  combustionTankLitres,
  vehicleSummary,
} from '../../lib/vehicle-home';

type RankedStation = NearbyFuelStation & {
  grossSaving: number;
  travelCost: number;
  realSaving: number;
};

function rankByRealSaving(
  stations: NearbyFuelStation[],
  fuel: FuelKind,
  tankLitres: number,
  consumptionLPer100Km: number,
): RankedStation[] {
  const priced = stations.filter(station => typeof station[fuel] === 'number');
  if (!priced.length) return [];

  const average =
    priced.reduce((sum, station) => sum + Number(station[fuel]), 0) /
    priced.length;

  return priced
    .map(station => {
      const price = Number(station[fuel]);
      const grossSaving = Math.max(0, (average - price) * tankLitres);
      const travelFuelLitres =
        ((station.distanceKm * 2) / 100) * consumptionLPer100Km;
      const travelCost = travelFuelLitres * price;
      const realSaving = Math.max(0, grossSaving - travelCost);

      return {
        ...station,
        grossSaving,
        travelCost,
        realSaving,
      };
    })
    .sort((a, b) => b.realSaving - a.realSaving);
}

export default function HomeScreen() {
  const [energy, setEnergy] = useState<'diesel' | 'petrol' | 'electric'>('diesel');
  const [vehicle, setVehicle] = useState<VehicleV2 | null>(null);
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [place, setPlace] = useState('A obter localização…');
  const [locationError, setLocationError] = useState<string | null>(null);

  const isElectricMode = energy === 'electric';
  const fuel: FuelKind = energy === 'diesel' ? 'diesel' : 'petrol';
  const tankLitres = combustionTankLitres(vehicle);
  const consumption = combustionConsumption(vehicle);

  const {
    stations,
    loading,
    error,
    providerName,
    refresh: refreshStations,
  } = useFuelStationsV2({
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    radiusKm: 60,
  });

  useFocusEffect(
    useCallback(() => {
      getVehicle().then(saved => {
        setVehicle(saved);
        setEnergy(vehiclePrimaryEnergy(saved));
      });
    }, []),
  );

  const refreshLocation = useCallback(async () => {
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setPlace('Localização desativada');
        setLocationError('Permite a localização para veres os postos perto de ti.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords(current.coords);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setPlace(
          address?.city ||
            address?.subregion ||
            address?.region ||
            'Localização atual',
        );
      } catch {
        setPlace('Localização atual');
      }
    } catch {
      setPlace('Não foi possível obter a localização');
      setLocationError('Toca para tentar novamente.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshLocation();
    }, [refreshLocation]),
  );

  const ranked = useMemo(
    () =>
      isElectricMode
        ? []
        : rankByRealSaving(stations, fuel, tankLitres, consumption),
    [stations, fuel, tankLitres, consumption, isElectricMode],
  );

  const best = ranked[0];

  const hasStalePrices = useMemo(
    () => stations.some(station => stationFreshness(station) === 'stale'),
    [stations],
  );

  const navigateToStation = useCallback(async (station: NearbyFuelStation) => {
    const destination = `${station.latitude},${station.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}&travelmode=driving`;
    await Linking.openURL(url);
  }, []);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>FuelFinder</Text>
          <Text style={styles.tagline}>Não abasteças sem comparar.</Text>
        </View>
        <View style={styles.avatar}>
          <Feather name="user" size={24} color="#17345B" />
        </View>
      </View>

      <Pressable style={styles.locationCard} onPress={refreshLocation}>
        <View style={styles.locationIcon}>
          <Feather name="navigation" size={24} color="#17345B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>{place}</Text>
          <Text style={styles.locationSub}>
            {coords
              ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(
                  4,
                )} · tocar para atualizar`
              : locationError || 'A usar a tua localização'}
          </Text>
        </View>
        <Feather name="refresh-cw" size={22} color="#6C7A8E" />
      </Pressable>

      <Pressable
        style={styles.vehicleCard}
        onPress={() => router.push('/(tabs)/vehicle')}
      >
        <View style={styles.vehicleIcon}>
          {vehicle?.energyType === 'electric' ||
          vehicle?.energyType === 'phev' ? (
            <MaterialIcons name="electric-car" size={26} color="#17345B" />
          ) : (
            <Feather name="truck" size={24} color="#17345B" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Veículo selecionado</Text>
          <Text style={styles.vehicleName}>
            {vehicle?.name ?? 'Adicionar veículo'}
          </Text>
          <Text style={styles.muted}>{vehicleSummary(vehicle)}</Text>
        </View>
        <Feather name="chevron-right" size={28} color="#6C7A8E" />
      </Pressable>

      {vehicle?.energyType === 'phev' ? (
        <>
          <Text style={styles.sectionTitle}>Modo de energia</Text>
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentItem,
                energy !== 'electric' && styles.segmentActive,
              ]}
              onPress={() => setEnergy('petrol')}
            >
              <Text
                style={[
                  styles.segmentText,
                  energy !== 'electric' && styles.segmentTextActive,
                ]}
              >
                Combustível
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentItem,
                energy === 'electric' && styles.segmentActive,
              ]}
              onPress={() => setEnergy('electric')}
            >
              <Text
                style={[
                  styles.segmentText,
                  energy === 'electric' && styles.segmentTextActive,
                ]}
              >
                Elétrico
              </Text>
            </Pressable>
          </View>
        </>
      ) : vehicle?.energyType === 'electric' ? null : (
        <>
          <Text style={styles.sectionTitle}>O teu combustível</Text>
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentItem,
                energy === 'diesel' && styles.segmentActive,
              ]}
              onPress={() => setEnergy('diesel')}
            >
              <Text
                style={[
                  styles.segmentText,
                  energy === 'diesel' && styles.segmentTextActive,
                ]}
              >
                Diesel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentItem,
                energy === 'petrol' && styles.segmentActive,
              ]}
              onPress={() => setEnergy('petrol')}
            >
              <Text
                style={[
                  styles.segmentText,
                  energy === 'petrol' && styles.segmentTextActive,
                ]}
              >
                Gasolina 95
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {isElectricMode ? (
        <View style={styles.evCard}>
          <View style={styles.evIcon}>
            <MaterialIcons name="electric-bolt" size={34} color="#17345B" />
          </View>
          <Text style={styles.evTitle}>Modo elétrico ativo</Text>
          <Text style={styles.evBody}>
            O fornecedor de carregamento ainda não está ligado. FuelFinder não
            irá mostrar postos de combustível como recomendação para um EV.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.dataState}>
            <DataStateBanner
              loading={loading}
              error={error}
              stale={hasStalePrices}
              providerName={providerName}
              onRetry={refreshStations}
            />
          </View>

          {best ? (
            <>
              <View style={styles.bestCard}>
                <View style={styles.badge}>
                  <Feather name="zap" size={20} color="#17345B" />
                  <Text style={styles.badgeText}>MELHOR POUPANÇA</Text>
                </View>

                <View style={styles.stationRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationBrand}>{best.brand}</Text>
                    <Text style={styles.stationPlace}>
                      {best.place} · {best.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <Text style={styles.price}>
                    €{Number(best[fuel]).toFixed(3)}
                    <Text style={styles.priceUnit}>/L</Text>
                  </Text>
                </View>

                <View style={styles.savingsBox}>
                  <Text style={styles.savingsLabel}>
                    Poupança real estimada
                  </Text>
                  <Text style={styles.savings}>
                    €{best.realSaving.toFixed(2)}
                  </Text>
                  <Text style={styles.savingsDetail}>
                    Poupança bruta €{best.grossSaving.toFixed(2)} • Viagem ~€
                    {best.travelCost.toFixed(2)}
                  </Text>
                  <Text style={styles.savingsDetail}>
                    Com base em {tankLitres} L e consumo de {consumption} L/100
                    km
                  </Text>
                </View>

                <View style={styles.bestActions}>
                  <Pressable
                    style={styles.detailsHero}
                    onPress={() => router.push(`/station/${best.id}`)}
                  >
                    <Feather name="info" size={20} color="#EAFBB2" />
                    <Text style={styles.detailsHeroText}>Detalhes</Text>
                  </Pressable>
                  <Pressable
                    style={styles.navigateCompact}
                    onPress={() => navigateToStation(best)}
                  >
                    <Feather name="navigation" size={20} color="#17345B" />
                    <Text style={styles.navigateCompactText}>Navegar</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.headerLine}>
                <Text style={styles.otherTitle}>Outras opções perto de ti</Text>
                <Pressable
                  style={styles.mapLinkButton}
                  onPress={() => router.push('/(tabs)/map')}
                >
                  <Text style={styles.link}>Ver mapa</Text>
                  <Feather name="map" size={17} color="#527D83" />
                </Pressable>
              </View>

              {ranked.slice(1, 4).map(station => (
                <Pressable
                  key={station.id}
                  style={styles.optionCard}
                  onPress={() => router.push(`/station/${station.id}`)}
                >
                  <View>
                    <Text style={styles.optionBrand}>{station.brand}</Text>
                    <Text style={styles.muted}>
                      {station.place} · {station.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.optionPrice}>
                      €{Number(station[fuel]).toFixed(3)}/L
                    </Text>
                    <Text style={styles.optionSaving}>
                      Poupa ~€{station.realSaving.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              ))}

              <View style={styles.sourceBanner}>
                <Feather
                  name={providerName === 'DGEG' ? 'database' : 'tool'}
                  size={17}
                  color="#527D83"
                />
                <Text style={styles.sourceText}>
                  Fonte: {providerName}. O mesmo fornecedor alimenta Home e
                  Mapa.
                </Text>
              </View>
            </>
          ) : !loading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sem postos nesta zona</Text>
              <Text style={styles.muted}>
                Tenta aumentar o raio ou atualizar a localização.
              </Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 24, paddingTop: 54, paddingBottom: 140 },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 42, fontWeight: '800', color: '#17345B' },
  tagline: { fontSize: 19, color: '#6C7A8E', marginTop: 2 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#B7F333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCard: {
    marginTop: 28,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D3E0E0',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EAFBB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: { fontSize: 20, fontWeight: '700', color: '#17345B' },
  locationSub: { marginTop: 3, fontSize: 14, color: '#6C7A8E' },
  vehicleCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D3E0E0',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EAFBB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17345B',
    marginVertical: 2,
  },
  muted: { color: '#6C7A8E', fontSize: 15 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17345B',
    marginTop: 30,
    marginBottom: 14,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#DDEEEE',
    borderRadius: 22,
    padding: 6,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { fontSize: 18, fontWeight: '700', color: '#6C7A8E' },
  segmentTextActive: { color: '#EAFBB2' },
  dataState: { marginTop: 22 },
  bestCard: {
    marginTop: 18,
    borderRadius: 30,
    padding: 24,
    backgroundColor: '#17345B',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#B7F333',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badgeText: { color: '#17345B', fontWeight: '800', fontSize: 15 },
  stationRow: {
    marginTop: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  stationBrand: { fontSize: 34, fontWeight: '800', color: 'white' },
  stationPlace: { marginTop: 6, fontSize: 18, color: '#CFDAE6' },
  price: { fontSize: 34, fontWeight: '800', color: '#B7F333' },
  priceUnit: { fontSize: 17 },
  savingsBox: {
    marginTop: 24,
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#244B73',
  },
  savingsLabel: { color: 'white', fontSize: 17 },
  savings: {
    marginTop: 6,
    fontSize: 48,
    fontWeight: '800',
    color: '#B7F333',
  },
  savingsDetail: { marginTop: 6, color: '#D4DFEA', fontSize: 14.5 },
  bestActions: { marginTop: 22, flexDirection: 'row', gap: 10 },
  detailsHero: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#B7F333',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  detailsHeroText: { color: '#EAFBB2', fontSize: 16, fontWeight: '800' },
  navigateCompact: {
    flex: 1,
    backgroundColor: '#B7F333',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navigateCompactText: { color: '#17345B', fontSize: 16, fontWeight: '900' },
  headerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
    marginBottom: 14,
  },
  otherTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#17345B' },
  mapLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  link: { color: '#527D83', fontWeight: '700', fontSize: 15 },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE6E6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionBrand: { color: '#17345B', fontWeight: '800', fontSize: 18 },
  optionPrice: { color: '#17345B', fontWeight: '800', fontSize: 18 },
  optionSaving: { color: '#5B7A27', fontWeight: '700', marginTop: 4 },
  sourceBanner: {
    marginTop: 18,
    backgroundColor: '#EAF5F5',
    padding: 14,
    borderRadius: 15,
    flexDirection: 'row',
    gap: 9,
  },
  sourceText: { flex: 1, color: '#527D83', fontSize: 13 },
  empty: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 22,
    marginTop: 24,
  },
  emptyTitle: {
    color: '#17345B',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  evCard: {
    marginTop: 26,
    backgroundColor: '#17345B',
    borderRadius: 30,
    padding: 24,
  },
  evIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: '#B7F333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evTitle: {
    marginTop: 20,
    color: 'white',
    fontWeight: '900',
    fontSize: 27,
  },
  evBody: {
    marginTop: 8,
    color: '#CFDAE6',
    fontSize: 16,
    lineHeight: 23,
  },
});
