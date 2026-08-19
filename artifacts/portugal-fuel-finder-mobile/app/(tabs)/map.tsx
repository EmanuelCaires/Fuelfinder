import { Feather, MaterialIcons } from '@expo/vector-icons';
import { getFavoriteIds, toggleFavorite } from '../../lib/favorites';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import {
  DevelopmentStationProvider,
  getNearbyStations,
  type FuelKind,
  type NearbyStation,
} from '../../lib/stations';

const provider = new DevelopmentStationProvider();

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [fuel, setFuel] = useState<FuelKind>('diesel');
  const [stations, setStations] = useState<NearbyStation[]>([]);
  const [selected, setSelected] = useState<NearbyStation | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [place, setPlace] = useState('A obter localização…');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Permite a localização para veres os postos no mapa.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
      setRegion(nextRegion);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setPlace(address?.city || address?.subregion || address?.region || 'Localização atual');
      } catch {
        setPlace('Localização atual');
      }

      const nearby = await getNearbyStations(
        provider,
        current.coords.latitude,
        current.coords.longitude,
        60,
      );
      setStations(nearby);
      setSelected(currentSelection => currentSelection ?? nearby[0] ?? null);
    } catch {
      setError('Não foi possível obter a tua localização.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    getFavoriteIds().then(setFavoriteIds);
  }, [load]));

  const selectedPrice = useMemo(
    () => selected ? selected[fuel] : null,
    [selected, fuel],
  );

  const navigate = useCallback(async (station: NearbyStation) => {
    const destination = `${station.latitude},${station.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    await Linking.openURL(url);
  }, []);

  const toggleSelectedFavorite = useCallback(async () => {
    if (!selected) return;

    const stationId = selected.id;
    const wasFavorite = favoriteIds.includes(stationId);

    // Update immediately so the user sees the heart change state.
    setFavoriteIds(current =>
      wasFavorite
        ? current.filter(id => id !== stationId)
        : Array.from(new Set([...current, stationId])),
    );

    try {
      const isNowFavorite = await toggleFavorite(stationId);
      setFavoriteIds(current =>
        isNowFavorite
          ? Array.from(new Set([...current, stationId]))
          : current.filter(id => id !== stationId),
      );
    } catch {
      // Restore previous state if local storage fails.
      setFavoriteIds(current =>
        wasFavorite
          ? Array.from(new Set([...current, stationId]))
          : current.filter(id => id !== stationId),
      );
    }
  }, [selected, favoriteIds]);

  const centerOnMe = useCallback(() => {
    if (region) {
      mapRef.current?.animateToRegion(region, 500);
    }
  }, [region]);

  if (loading && !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>A preparar o mapa…</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Feather name="map-pin" size={28} color="#17345B" />
        </View>
        <Text style={styles.errorTitle}>Precisamos da tua localização</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelected(null)}
      >
        {stations.map(station => (
          <Marker
            key={`${station.id}-${fuel}`}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            onPress={() => setSelected(station)}
            tracksViewChanges={true}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.marker, selected?.id === station.id && styles.markerSelected]}>
              <Text style={styles.markerSymbol}>€</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topPanel}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mapa</Text>
            <Text style={styles.subtitle}>{place} · {stations.length} postos de desenvolvimento</Text>
          </View>
          <Pressable style={styles.locationButton} onPress={centerOnMe}>
            <Feather name="crosshair" size={22} color="#17345B" />
          </Pressable>
        </View>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentItem, fuel === 'diesel' && styles.segmentActive]}
            onPress={() => setFuel('diesel')}
          >
            <Text style={[styles.segmentText, fuel === 'diesel' && styles.segmentTextActive]}>Diesel</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, fuel === 'petrol' && styles.segmentActive]}
            onPress={() => setFuel('petrol')}
          >
            <Text style={[styles.segmentText, fuel === 'petrol' && styles.segmentTextActive]}>Gasolina 95</Text>
          </Pressable>
        </View>
      </View>

      {selected && selectedPrice !== null && (
        <View style={styles.stationCard}>
          <View style={styles.stationHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationBrand}>{selected.brand}</Text>
              <Text style={styles.stationPlace}>{selected.place} · {selected.distanceKm.toFixed(1)} km</Text>
            </View>
            <Text style={styles.price}>€{selectedPrice.toFixed(3)}<Text style={styles.unit}>/L</Text></Text>
          </View>

          <View style={styles.devPill}>
            <Feather name="info" size={15} color="#7B6410" />
            <Text style={styles.devText}>Preço de desenvolvimento</Text>
          </View>

          <View style={styles.cardActions}>
            <Pressable style={styles.detailsButton} onPress={() => router.push(`/station/${selected.id}`)}>
              <Feather name="info" size={20} color="#EAFBB2" />
              <Text style={styles.detailsText}>Detalhes</Text>
            </Pressable>

            <Pressable
              style={[
                styles.favoriteMini,
                favoriteIds.includes(selected.id) && styles.favoriteMiniActive,
              ]}
              onPress={(event) => {
                event.stopPropagation();
                toggleSelectedFavorite();
              }}
              hitSlop={10}
            >
              <MaterialIcons
                name={favoriteIds.includes(selected.id) ? 'favorite' : 'favorite-border'}
                size={25}
                color="#17345B"
              />
            </Pressable>
          </View>

          <Pressable style={styles.navigate} onPress={() => navigate(selected)}>
            <Feather name="navigation" size={21} color="#17345B" />
            <Text style={styles.navigateText}>Navegar até ao posto</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBFB' },
  center: {
    flex: 1,
    backgroundColor: '#F4FBFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: { marginTop: 12, color: '#6C7A8E', fontSize: 16 },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#EAFBB2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  errorTitle: { color: '#17345B', fontWeight: '800', fontSize: 23, textAlign: 'center' },
  errorText: { color: '#6C7A8E', fontSize: 16, textAlign: 'center', marginTop: 8 },
  retry: {
    marginTop: 22,
    backgroundColor: '#B7F333',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: { color: '#17345B', fontWeight: '800', fontSize: 17 },

  topPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 48,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E4E4',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#17345B' },
  subtitle: { color: '#6C7A8E', marginTop: 2, fontSize: 13.5 },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#EAFBB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#DDEEEE',
    borderRadius: 16,
    padding: 4,
    marginTop: 14,
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13 },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { color: '#6C7A8E', fontWeight: '700', fontSize: 15 },
  segmentTextActive: { color: '#EAFBB2' },

  marker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B7F333',
    borderWidth: 3,
    borderColor: '#17345B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.12 }],
    borderWidth: 4,
  },
  markerSymbol: {
    color: '#17345B',
    fontWeight: '900',
    fontSize: 20,
    lineHeight: 22,
    includeFontPadding: false,
  },

  stationCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    backgroundColor: '#17345B',
    borderRadius: 26,
    padding: 20,
  },
  stationHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stationBrand: { color: 'white', fontSize: 27, fontWeight: '800' },
  stationPlace: { color: '#CFDAE6', fontSize: 15.5, marginTop: 3 },
  price: { color: '#B7F333', fontSize: 28, fontWeight: '900' },
  unit: { fontSize: 14 },
  devPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFF7D7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  devText: { color: '#7B6410', fontSize: 12.5, fontWeight: '700' },
  cardActions: { marginTop: 15, flexDirection: 'row', gap: 10 },
  detailsButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#B7F333',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  detailsText: { color: '#EAFBB2', fontWeight: '800', fontSize: 15 },
  favoriteMini: {
    width: 52,
    borderRadius: 15,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#B7F333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteMiniActive: {
    backgroundColor: '#B7F333',
    borderColor: '#B7F333',
  },
  navigate: {
    marginTop: 12,
    backgroundColor: '#B7F333',
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  navigateText: { color: '#17345B', fontWeight: '800', fontSize: 17 },
});
