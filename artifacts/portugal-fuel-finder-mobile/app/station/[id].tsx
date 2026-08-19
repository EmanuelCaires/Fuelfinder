import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getStationById, haversineKm, type FuelKind } from '../../lib/stations';
import { isFavorite, setFavorite } from '../../lib/favorites';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const station = useMemo(() => getStationById(String(id)), [id]);

  const [fuel, setFuel] = useState<FuelKind>('diesel');
  const [favorite, setFavoriteState] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (!station) return;
    isFavorite(station.id).then(setFavoriteState);

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setDistanceKm(
          haversineKm(
            current.coords.latitude,
            current.coords.longitude,
            station.latitude,
            station.longitude,
          ),
        );
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, [station]);

  const toggle = useCallback(async () => {
    if (!station) return;
    const next = !favorite;
    setFavoriteState(next);
    await setFavorite(station.id, next);
  }, [favorite, station]);

  const navigate = useCallback(async () => {
    if (!station) return;
    const destination = `${station.latitude},${station.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    await Linking.openURL(url);
  }, [station]);

  if (!station) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.title}>Posto não encontrado</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#17345B" />
          </Pressable>

          <Text style={styles.screenTitle}>Detalhes do posto</Text>

          <Pressable style={[styles.iconButton, favorite && styles.favoriteButton]} onPress={toggle}>
            <MaterialIcons
              name={favorite ? 'favorite' : 'favorite-border'}
              size={26}
              color="#17345B"
            />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.brandBadge}>
            <Feather name="map-pin" size={24} color="#17345B" />
          </View>
          <Text style={styles.brand}>{station.brand}</Text>
          <Text style={styles.place}>{station.name} · {station.place}</Text>

          <View style={styles.distanceRow}>
            <Feather name="navigation" size={17} color="#CFDAE6" />
            {loadingLocation ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.distance}>
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km da tua localização` : 'Distância indisponível'}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preço</Text>
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

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Preço atual</Text>
            <Text style={styles.source}>Dados de desenvolvimento</Text>
          </View>
          <Text style={styles.price}>€{station[fuel].toFixed(3)}<Text style={styles.unit}>/L</Text></Text>
        </View>

        <Text style={styles.sectionTitle}>Informação</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="clock" label="Horário" value="A aguardar dados oficiais" />
          <InfoRow icon="credit-card" label="Serviços" value="A aguardar dados oficiais" />
          <InfoRow icon="database" label="Fonte" value="Desenvolvimento / DGEG pendente" />
          <InfoRow icon="refresh-cw" label="Atualização" value="Será mostrada com o feed oficial" last />
        </View>

        <Pressable style={styles.primaryButton} onPress={navigate}>
          <Feather name="navigation" size={22} color="#17345B" />
          <Text style={styles.primaryText}>Navegar até ao posto</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={toggle}>
          <Feather name="heart" size={20} color="#17345B" />
          <Text style={styles.secondaryText}>{favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</Text>
        </Pressable>

        <View style={styles.notice}>
          <Feather name="alert-triangle" size={18} color="#7B6410" />
          <Text style={styles.noticeText}>
            Este posto e os preços ainda são dados de desenvolvimento. A estrutura está preparada para receber localização,
            horários, serviços e preços oficiais da DGEG.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <View style={styles.infoIcon}><Feather name={icon} size={18} color="#17345B" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 22, paddingTop: 18, paddingBottom: 48 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: 'white',
    borderWidth: 1, borderColor: '#D8E4E4', alignItems: 'center', justifyContent: 'center',
  },
  favoriteButton: { backgroundColor: '#F2FFD2', borderColor: '#B7F333' },
  screenTitle: { fontSize: 19, fontWeight: '800', color: '#17345B' },
  hero: { marginTop: 22, borderRadius: 28, backgroundColor: '#17345B', padding: 24 },
  brandBadge: {
    width: 52, height: 52, borderRadius: 17, backgroundColor: '#B7F333',
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { marginTop: 22, fontSize: 36, fontWeight: '900', color: 'white' },
  place: { marginTop: 5, fontSize: 17, color: '#CFDAE6' },
  distanceRow: { marginTop: 18, flexDirection: 'row', gap: 8, alignItems: 'center' },
  distance: { color: '#CFDAE6', fontSize: 15 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#17345B', marginTop: 26, marginBottom: 12 },
  segment: { flexDirection: 'row', borderRadius: 18, padding: 5, backgroundColor: '#DDEEEE' },
  segmentItem: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { color: '#6C7A8E', fontWeight: '700', fontSize: 16 },
  segmentTextActive: { color: '#EAFBB2' },
  priceCard: {
    marginTop: 12, backgroundColor: 'white', borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: '#D8E4E4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  priceLabel: { color: '#17345B', fontWeight: '800', fontSize: 17 },
  source: { color: '#7B8796', marginTop: 4, fontSize: 13 },
  price: { color: '#17345B', fontWeight: '900', fontSize: 31 },
  unit: { fontSize: 15 },
  infoCard: { backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: '#D8E4E4', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: 17 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: '#E6EEEE' },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EAFBB2', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#6C7A8E', fontSize: 13 },
  infoValue: { color: '#17345B', fontWeight: '700', marginTop: 2, fontSize: 15 },
  primaryButton: {
    marginTop: 26, backgroundColor: '#B7F333', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
  },
  primaryText: { color: '#17345B', fontWeight: '900', fontSize: 17 },
  secondaryButton: {
    marginTop: 12, backgroundColor: 'white', borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: '#D8E4E4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
  },
  secondaryText: { color: '#17345B', fontWeight: '800', fontSize: 16 },
  notice: { marginTop: 18, backgroundColor: '#FFF7D7', borderRadius: 16, padding: 15, flexDirection: 'row', gap: 10 },
  noticeText: { flex: 1, color: '#7B6410', lineHeight: 19, fontSize: 13 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { color: '#17345B', fontSize: 24, fontWeight: '800' },
});
