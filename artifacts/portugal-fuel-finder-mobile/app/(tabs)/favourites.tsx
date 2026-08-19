import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getFavoriteIds, setFavorite } from '../../lib/favorites';
import { DEVELOPMENT_STATIONS, type FuelKind } from '../../lib/stations';

export default function FavoritesScreen() {
  const [ids, setIds] = useState<string[]>([]);
  const [fuel, setFuel] = useState<FuelKind>('diesel');

  const load = useCallback(() => {
    getFavoriteIds().then(setIds);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const stations = useMemo(
    () => DEVELOPMENT_STATIONS.filter(station => ids.includes(station.id)),
    [ids],
  );

  const remove = useCallback(async (id: string) => {
    const next = await setFavorite(id, false);
    setIds(next);
  }, []);

  const navigate = useCallback(async (latitude: number, longitude: number) => {
    const destination = `${latitude},${longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    await Linking.openURL(url);
  }, []);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Os teus postos guardados num só lugar.</Text>

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

      {stations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="heart" size={30} color="#17345B" /></View>
          <Text style={styles.emptyTitle}>Ainda não tens favoritos</Text>
          <Text style={styles.emptyText}>
            Abre um posto no mapa e toca no coração para o guardares aqui.
          </Text>
          <Pressable style={styles.mapButton} onPress={() => router.push('/(tabs)/map')}>
            <Feather name="map" size={20} color="#17345B" />
            <Text style={styles.mapButtonText}>Explorar mapa</Text>
          </Pressable>
        </View>
      ) : (
        stations.map(station => (
          <Pressable
            key={station.id}
            style={styles.card}
            onPress={() => router.push(`/station/${station.id}`)}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>{station.brand}</Text>
                <Text style={styles.place}>{station.place}</Text>
              </View>
              <Pressable
                hitSlop={10}
                style={styles.heart}
                onPress={(event) => {
                  event.stopPropagation();
                  remove(station.id);
                }}
              >
                <MaterialIcons name="favorite" size={24} color="#17345B" />
              </Pressable>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>€{station[fuel].toFixed(3)}<Text style={styles.unit}>/L</Text></Text>
              <View style={styles.devPill}><Text style={styles.devText}>DESENVOLVIMENTO</Text></View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryAction}
                onPress={(event) => {
                  event.stopPropagation();
                  router.push(`/station/${station.id}`);
                }}
              >
                <Feather name="info" size={18} color="#17345B" />
                <Text style={styles.secondaryActionText}>Detalhes</Text>
              </Pressable>

              <Pressable
                style={styles.primaryAction}
                onPress={(event) => {
                  event.stopPropagation();
                  navigate(station.latitude, station.longitude);
                }}
              >
                <Feather name="navigation" size={18} color="#17345B" />
                <Text style={styles.primaryActionText}>Navegar</Text>
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      <View style={styles.notice}>
        <Feather name="info" size={17} color="#7B6410" />
        <Text style={styles.noticeText}>
          Os favoritos ficam guardados localmente neste dispositivo. Mais tarde podemos sincronizá-los entre dispositivos se adicionarmos conta opcional.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 24, paddingTop: 54, paddingBottom: 130 },
  title: { fontSize: 40, fontWeight: '900', color: '#17345B' },
  subtitle: { marginTop: 3, color: '#6C7A8E', fontSize: 17 },
  segment: { marginTop: 24, flexDirection: 'row', backgroundColor: '#DDEEEE', borderRadius: 18, padding: 5 },
  segmentItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { color: '#6C7A8E', fontWeight: '700', fontSize: 15.5 },
  segmentTextActive: { color: '#EAFBB2' },
  empty: {
    marginTop: 30, backgroundColor: 'white', borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: '#D8E4E4', alignItems: 'center',
  },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#EAFBB2', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 18, color: '#17345B', fontSize: 21, fontWeight: '800' },
  emptyText: { marginTop: 8, color: '#6C7A8E', textAlign: 'center', lineHeight: 21, fontSize: 15 },
  mapButton: { marginTop: 20, backgroundColor: '#B7F333', borderRadius: 17, paddingVertical: 14, paddingHorizontal: 22, flexDirection: 'row', gap: 8, alignItems: 'center' },
  mapButtonText: { color: '#17345B', fontWeight: '800', fontSize: 16 },
  card: { marginTop: 18, backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#D8E4E4' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  brand: { color: '#17345B', fontSize: 24, fontWeight: '900' },
  place: { color: '#6C7A8E', marginTop: 3, fontSize: 15 },
  heart: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F2FFD2', alignItems: 'center', justifyContent: 'center' },
  priceRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#17345B', fontSize: 30, fontWeight: '900' },
  unit: { fontSize: 14 },
  devPill: { backgroundColor: '#FFF7D7', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  devText: { color: '#7B6410', fontSize: 10.5, fontWeight: '800' },
  actions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, borderRadius: 15, borderWidth: 1, borderColor: '#D8E4E4', paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  secondaryActionText: { color: '#17345B', fontWeight: '800' },
  primaryAction: { flex: 1, borderRadius: 15, backgroundColor: '#B7F333', paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  primaryActionText: { color: '#17345B', fontWeight: '800' },
  notice: { marginTop: 22, backgroundColor: '#FFF7D7', borderRadius: 15, padding: 14, flexDirection: 'row', gap: 9 },
  noticeText: { flex: 1, color: '#7B6410', lineHeight: 19, fontSize: 12.5 },
});
