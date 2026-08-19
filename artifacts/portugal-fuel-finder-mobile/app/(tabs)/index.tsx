
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DevelopmentStationProvider, getNearbyStations, rankByRealSaving, type FuelKind, type NearbyStation } from '../../lib/stations';

type Vehicle = {
  name: string;
  make?: string;
  model?: string;
  registration?: string;
  fuel: FuelKind;
  tankLitres: number;
  consumption: number;
};

const VEHICLE_KEY = 'fuelfinder:vehicle:v1';
const provider = new DevelopmentStationProvider();

export default function HomeScreen() {
  const [fuel, setFuel] = useState<FuelKind>('diesel');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [place, setPlace] = useState('A obter localização…');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stations, setStations] = useState<NearbyStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  const tankLitres = vehicle?.tankLitres ?? 50;
  const consumption = vehicle?.consumption ?? 6.5;

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(VEHICLE_KEY).then(raw => {
      if (!raw) return setVehicle(null);
      try {
        const parsed = JSON.parse(raw) as Vehicle;
        setVehicle(parsed);
        setFuel(parsed.fuel);
      } catch {
        setVehicle(null);
      }
    });
  }, []));

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
        setPlace(address?.city || address?.subregion || address?.region || 'Localização atual');
      } catch {
        setPlace('Localização atual');
      }

      setLoadingStations(true);
      const nearby = await getNearbyStations(
        provider,
        current.coords.latitude,
        current.coords.longitude,
        60,
      );
      setStations(nearby);
    } catch {
      setPlace('Não foi possível obter a localização');
      setLocationError('Toca para tentar novamente.');
    } finally {
      setLoadingStations(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refreshLocation();
  }, [refreshLocation]));

  const ranked = useMemo(
    () => rankByRealSaving(stations, fuel, tankLitres, consumption),
    [stations, fuel, tankLitres, consumption],
  );
  const best = ranked[0];

  const navigateToStation = useCallback(async (station: NearbyStation) => {
    const destination = `${station.latitude},${station.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    await Linking.openURL(url);
  }, []);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>FuelFinder</Text>
          <Text style={styles.tagline}>Não abasteças sem comparar.</Text>
        </View>
        <View style={styles.avatar}><Feather name="user" size={24} color="#17345B" /></View>
      </View>

      <Pressable style={styles.locationCard} onPress={refreshLocation}>
        <View style={styles.locationIcon}><Feather name="navigation" size={24} color="#17345B" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>{place}</Text>
          <Text style={styles.locationSub}>
            {coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} · tocar para atualizar` : (locationError || 'A usar a tua localização')}
          </Text>
        </View>
        <Feather name="refresh-cw" size={22} color="#6C7A8E" />
      </Pressable>

      <Pressable style={styles.vehicleCard} onPress={() => router.push('/(tabs)/vehicle')}>
        <View style={styles.vehicleIcon}><Feather name="truck" size={24} color="#17345B" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Veículo selecionado</Text>
          <Text style={styles.vehicleName}>{vehicle?.name ?? 'Adicionar veículo'}</Text>
          <Text style={styles.muted}>{vehicle ? `${vehicle.fuel === 'diesel' ? 'Diesel' : 'Gasolina 95'} · ${vehicle.tankLitres} L · ${vehicle.consumption} L/100 km` : 'Personaliza a tua poupança'}</Text>
        </View>
        <Feather name="chevron-right" size={28} color="#6C7A8E" />
      </Pressable>

      <Text style={styles.sectionTitle}>O teu combustível</Text>
      <View style={styles.segment}>
        <Pressable style={[styles.segmentItem, fuel === 'diesel' && styles.segmentActive]} onPress={() => setFuel('diesel')}>
          <Text style={[styles.segmentText, fuel === 'diesel' && styles.segmentTextActive]}>Diesel</Text>
        </Pressable>
        <Pressable style={[styles.segmentItem, fuel === 'petrol' && styles.segmentActive]} onPress={() => setFuel('petrol')}>
          <Text style={[styles.segmentText, fuel === 'petrol' && styles.segmentTextActive]}>Gasolina 95</Text>
        </Pressable>
      </View>

      {loadingStations ? (
        <View style={styles.loading}><ActivityIndicator /><Text style={styles.muted}>A procurar postos perto de ti…</Text></View>
      ) : best ? (
        <>
          <View style={styles.bestCard}>
            <View style={styles.badge}><Feather name="zap" size={20} color="#17345B" /><Text style={styles.badgeText}>MELHOR POUPANÇA</Text></View>
            <View style={styles.stationRow}>
              <View>
                <Text style={styles.stationBrand}>{best.brand}</Text>
                <Text style={styles.stationPlace}>{best.place} · {best.distanceKm.toFixed(1)} km</Text>
              </View>
              <Text style={styles.price}>€{best[fuel].toFixed(3)}<Text style={styles.priceUnit}>/L</Text></Text>
            </View>
            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>Poupança real estimada</Text>
              <Text style={styles.savings}>€{best.realSaving.toFixed(2)}</Text>
              <Text style={styles.savingsDetail}>Poupança bruta €{best.grossSaving.toFixed(2)}  •  Viagem ~€{best.travelCost.toFixed(2)}</Text>
              <Text style={styles.savingsDetail}>Com base em {tankLitres} L e consumo de {consumption} L/100 km</Text>
            </View>
            <View style={styles.bestActions}>
              <Pressable style={styles.detailsHero} onPress={() => router.push(`/station/${best.id}`)}>
                <Feather name="info" size={20} color="#EAFBB2" />
                <Text style={styles.detailsHeroText}>Detalhes</Text>
              </Pressable>
              <Pressable style={styles.navigateCompact} onPress={() => navigateToStation(best)}>
                <Feather name="navigation" size={20} color="#17345B" />
                <Text style={styles.navigateCompactText}>Navegar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.headerLine}>
            <Text style={styles.otherTitle}>Outras opções perto de ti</Text>
            <Pressable style={styles.mapLinkButton} onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.link}>Ver mapa</Text>
              <Feather name="map" size={17} color="#527D83" />
            </Pressable>
          </View>

          {ranked.slice(1, 4).map(station => (
            <Pressable key={station.id} style={styles.optionCard} onPress={() => router.push(`/station/${station.id}`)}>
              <View>
                <Text style={styles.optionBrand}>{station.brand}</Text>
                <Text style={styles.muted}>{station.place} · {station.distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.optionPrice}>€{station[fuel].toFixed(3)}/L</Text>
                <Text style={styles.optionSaving}>Poupa ~€{station.realSaving.toFixed(2)}</Text>
              </View>
            </Pressable>
          ))}

          <View style={styles.devBanner}>
            <Feather name="alert-triangle" size={18} color="#7B6410" />
            <Text style={styles.devText}>Preços de desenvolvimento. As distâncias são calculadas com o teu GPS real; os preços serão substituídos pela fonte oficial quando o acesso DGEG estiver ativo.</Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sem postos de desenvolvimento nesta zona</Text>
          <Text style={styles.muted}>O sistema já está preparado para receber o feed oficial da DGEG.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 24, paddingTop: 54, paddingBottom: 140 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 42, fontWeight: '800', color: '#17345B' },
  tagline: { fontSize: 19, color: '#6C7A8E', marginTop: 2 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#B7F333', alignItems: 'center', justifyContent: 'center' },
  locationCard: { marginTop: 28, borderRadius: 24, padding: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#D3E0E0', flexDirection: 'row', gap: 16, alignItems: 'center' },
  locationIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EAFBB2', alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 20, fontWeight: '700', color: '#17345B' },
  locationSub: { marginTop: 3, fontSize: 14, color: '#6C7A8E' },
  vehicleCard: { marginTop: 20, borderRadius: 24, padding: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#D3E0E0', flexDirection: 'row', gap: 16, alignItems: 'center' },
  vehicleIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#EAFBB2', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: 22, fontWeight: '800', color: '#17345B', marginVertical: 2 },
  muted: { color: '#6C7A8E', fontSize: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#17345B', marginTop: 30, marginBottom: 14 },
  segment: { flexDirection: 'row', backgroundColor: '#DDEEEE', borderRadius: 22, padding: 6 },
  segmentItem: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { fontSize: 18, fontWeight: '700', color: '#6C7A8E' },
  segmentTextActive: { color: '#EAFBB2' },
  loading: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  bestCard: { marginTop: 24, borderRadius: 30, padding: 24, backgroundColor: '#17345B' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#B7F333', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', gap: 8, alignItems: 'center' },
  badgeText: { color: '#17345B', fontWeight: '800', fontSize: 15 },
  stationRow: { marginTop: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stationBrand: { fontSize: 34, fontWeight: '800', color: 'white' },
  stationPlace: { marginTop: 6, fontSize: 18, color: '#CFDAE6' },
  price: { fontSize: 36, fontWeight: '800', color: '#B7F333' },
  priceUnit: { fontSize: 17 },
  savingsBox: { marginTop: 24, borderRadius: 22, padding: 20, backgroundColor: '#244B73' },
  savingsLabel: { color: 'white', fontSize: 17 },
  savings: { marginTop: 6, fontSize: 48, fontWeight: '800', color: '#B7F333' },
  savingsDetail: { marginTop: 6, color: '#D4DFEA', fontSize: 14.5 },
  bestActions: { marginTop: 22, flexDirection: 'row', gap: 10 },
  detailsHero: {
    flex: 1, borderWidth: 1.5, borderColor: '#B7F333', borderRadius: 18,
    paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  detailsHeroText: { color: '#EAFBB2', fontSize: 16, fontWeight: '800' },
  navigateCompact: {
    flex: 1, backgroundColor: '#B7F333', borderRadius: 18,
    paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  navigateCompactText: { color: '#17345B', fontSize: 16, fontWeight: '900' },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 30, marginBottom: 14 },
  otherTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#17345B' },
  mapLinkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingLeft: 8 },
  link: { color: '#527D83', fontWeight: '700', fontSize: 15 },
  optionCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#DDE6E6', flexDirection: 'row', justifyContent: 'space-between' },
  optionBrand: { color: '#17345B', fontWeight: '800', fontSize: 18 },
  optionPrice: { color: '#17345B', fontWeight: '800', fontSize: 18 },
  optionSaving: { color: '#5B7A27', fontWeight: '700', marginTop: 4 },
  devBanner: { marginTop: 18, backgroundColor: '#FFF7D7', padding: 16, borderRadius: 16, flexDirection: 'row', gap: 10 },
  devText: { flex: 1, color: '#7B6410', lineHeight: 20, fontSize: 13.5 },
  empty: { backgroundColor: 'white', padding: 24, borderRadius: 22, marginTop: 24 },
  emptyTitle: { color: '#17345B', fontSize: 19, fontWeight: '800', marginBottom: 6 },
});
