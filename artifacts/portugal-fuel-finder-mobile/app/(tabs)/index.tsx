import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Fuel = 'diesel' | 'petrol';
type Vehicle = {
  nickname: string;
  make: string;
  model: string;
  registration: string;
  fuel: 'Diesel' | 'Gasolina 95';
  tank: string;
  consumption: string;
};

const VEHICLE_KEY = 'fuelfinder.vehicle';
const stations = [
  { name: 'PRIO', place: 'Sacavém', diesel: 1.579, petrol: 1.669, km: 2.1 },
  { name: 'Intermarché', place: 'Loures', diesel: 1.594, petrol: 1.674, km: 3.8 },
  { name: 'GALP', place: 'Lisboa', diesel: 1.689, petrol: 1.779, km: 0.9 },
];

export default function HomeScreen() {
  const router = useRouter();
  const [fuel, setFuel] = useState<Fuel>('diesel');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(VEHICLE_KEY)
        .then(value => {
          if (!active) return;
          if (!value) {
            setVehicle(null);
            return;
          }
          const parsed = JSON.parse(value) as Vehicle;
          setVehicle(parsed);
          setFuel(parsed.fuel === 'Gasolina 95' ? 'petrol' : 'diesel');
        })
        .catch(() => {
          if (active) setVehicle(null);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const tankLitres = Math.max(1, Number.parseFloat(vehicle?.tank ?? '50') || 50);
  const consumption = Math.max(0.1, Number.parseFloat(vehicle?.consumption ?? '6.5') || 6.5);

  const ranked = useMemo(() => {
    const average = stations.reduce((sum, station) => sum + station[fuel], 0) / stations.length;
    return stations
      .map(station => {
        const grossSaving = Math.max(0, (average - station[fuel]) * tankLitres);
        const roundTripKm = station.km * 2;
        const tripFuelLitres = (roundTripKm / 100) * consumption;
        const tripCost = tripFuelLitres * station[fuel];
        return {
          ...station,
          grossSaving,
          tripCost,
          saving: Math.max(0, grossSaving - tripCost),
        };
      })
      .sort((a, b) => b.saving - a.saving);
  }, [consumption, fuel, tankLitres]);

  const best = ranked[0];
  const vehicleName = vehicle
    ? vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'O meu veículo'
    : 'Adicionar veículo';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>FuelFinder</Text>
            <Text style={styles.tagline}>Não abasteças sem comparar.</Text>
          </View>
          <View style={styles.avatar}><Feather name="user" size={20} color="#152A46" /></View>
        </View>

        <View style={styles.location}>
          <Feather name="map-pin" size={17} color="#152A46" />
          <Text style={styles.locationText}>A usar a tua localização</Text>
        </View>

        <Pressable style={styles.vehicleCard} onPress={() => router.push('/(tabs)/vehicle')}>
          <View style={styles.vehicleIcon}><Feather name="truck" size={18} color="#152A46" /></View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>{vehicle ? 'Veículo selecionado' : 'Personaliza a tua poupança'}</Text>
            <Text style={styles.vehicleName}>{vehicleName}</Text>
            <Text style={styles.vehicleMeta}>
              {vehicle
                ? `${vehicle.fuel} · ${tankLitres.toFixed(0)} L · ${consumption.toFixed(1)} L/100 km`
                : 'Adiciona o teu carro para calcular a poupança real'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#607083" />
        </Pressable>

        <Text style={styles.sectionLabel}>O teu combustível</Text>
        <View style={styles.segment}>
          <Pressable onPress={() => setFuel('diesel')} style={[styles.segmentButton, fuel === 'diesel' && styles.segmentActive]}>
            <Text style={[styles.segmentText, fuel === 'diesel' && styles.segmentTextActive]}>Diesel</Text>
          </Pressable>
          <Pressable onPress={() => setFuel('petrol')} style={[styles.segmentButton, fuel === 'petrol' && styles.segmentActive]}>
            <Text style={[styles.segmentText, fuel === 'petrol' && styles.segmentTextActive]}>Gasolina 95</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}><Feather name="zap" size={14} color="#152A46" /><Text style={styles.badgeText}>MELHOR POUPANÇA</Text></View>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.station}>{best.name}</Text>
              <Text style={styles.place}>{best.place} · {best.km.toFixed(1)} km</Text>
            </View>
            <Text style={styles.price}>€{best[fuel].toFixed(3)}<Text style={styles.per}>/L</Text></Text>
          </View>

          <View style={styles.savingBox}>
            <Text style={styles.savingLabel}>Poupança real estimada</Text>
            <Text style={styles.saving}>€{best.saving.toFixed(2)}</Text>
            <View style={styles.breakdown}>
              <Text style={styles.breakdownText}>Poupança bruta €{best.grossSaving.toFixed(2)}</Text>
              <Text style={styles.breakdownDot}>•</Text>
              <Text style={styles.breakdownText}>Viagem ~€{best.tripCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.small}>Com base em {tankLitres.toFixed(0)} L e consumo de {consumption.toFixed(1)} L/100 km</Text>
          </View>

          <Pressable style={styles.navigate}>
            <Feather name="navigation" size={18} color="#E8F8A7" />
            <Text style={styles.navigateText}>Navegar até ao posto</Text>
          </Pressable>
        </View>

        <View style={styles.headingRow}><Text style={styles.heading}>Outras opções perto de ti</Text><Text style={styles.link}>Ver mapa</Text></View>
        {ranked.slice(1).map(station => (
          <View style={styles.stationCard} key={station.name}>
            <View><Text style={styles.cardName}>{station.name}</Text><Text style={styles.cardMeta}>{station.place} · {station.km.toFixed(1)} km</Text></View>
            <View style={styles.right}><Text style={styles.cardPrice}>€{station[fuel].toFixed(3)}/L</Text><Text style={styles.cardSaving}>Poupa €{station.saving.toFixed(2)}</Text></View>
          </View>
        ))}

        <View style={styles.dev}><Feather name="info" size={14} color="#607083" /><Text style={styles.devText}>Dados de desenvolvimento enquanto aguardamos a fonte oficial.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F1F7F8'},content:{padding:20,paddingBottom:110,gap:16},brandRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontFamily:'Inter_700Bold',fontSize:29,color:'#152A46'},tagline:{fontFamily:'Inter_500Medium',fontSize:14,color:'#607083',marginTop:2},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#B8E63D',alignItems:'center',justifyContent:'center'},location:{flexDirection:'row',gap:8,alignItems:'center',backgroundColor:'#fff',borderRadius:14,padding:14,borderWidth:1,borderColor:'#CBDCDD'},locationText:{fontFamily:'Inter_600SemiBold',color:'#152A46'},vehicleCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#fff',borderRadius:16,padding:14,borderWidth:1,borderColor:'#CBDCDD'},vehicleIcon:{width:42,height:42,borderRadius:13,backgroundColor:'#E8F8A7',alignItems:'center',justifyContent:'center'},vehicleInfo:{flex:1},vehicleLabel:{fontFamily:'Inter_500Medium',fontSize:11,color:'#607083'},vehicleName:{fontFamily:'Inter_700Bold',fontSize:15,color:'#152A46',marginTop:2},vehicleMeta:{fontFamily:'Inter_400Regular',fontSize:11,color:'#607083',marginTop:3},sectionLabel:{fontFamily:'Inter_600SemiBold',color:'#152A46',marginTop:4},segment:{flexDirection:'row',backgroundColor:'#DCEDEF',padding:4,borderRadius:14},segmentButton:{flex:1,padding:12,alignItems:'center',borderRadius:11},segmentActive:{backgroundColor:'#152A46'},segmentText:{fontFamily:'Inter_600SemiBold',color:'#607083'},segmentTextActive:{color:'#E8F8A7'},hero:{backgroundColor:'#152A46',borderRadius:22,padding:20,gap:16},badge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#B8E63D',borderRadius:20,paddingVertical:6,paddingHorizontal:10},badgeText:{fontFamily:'Inter_700Bold',fontSize:11,color:'#152A46'},heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},station:{fontFamily:'Inter_700Bold',fontSize:25,color:'#fff'},place:{fontFamily:'Inter_400Regular',color:'#C8D5DF',marginTop:4},price:{fontFamily:'Inter_700Bold',fontSize:25,color:'#B8E63D'},per:{fontFamily:'Inter_500Medium',fontSize:13},savingBox:{backgroundColor:'#203B5B',borderRadius:16,padding:15},savingLabel:{fontFamily:'Inter_500Medium',color:'#D8E5EC',fontSize:12},saving:{fontFamily:'Inter_700Bold',fontSize:34,color:'#B8E63D',marginVertical:3},breakdown:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:5,marginBottom:6},breakdownText:{fontFamily:'Inter_500Medium',fontSize:11,color:'#D8E5EC'},breakdownDot:{color:'#8EA2B1'},small:{fontFamily:'Inter_400Regular',fontSize:11,color:'#AFC0CC',lineHeight:16},navigate:{height:50,borderRadius:14,backgroundColor:'#203B5B',borderWidth:1,borderColor:'#B8E63D',flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},navigateText:{fontFamily:'Inter_700Bold',color:'#E8F8A7'},headingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:4},heading:{fontFamily:'Inter_700Bold',fontSize:18,color:'#152A46'},link:{fontFamily:'Inter_600SemiBold',color:'#497A83'},stationCard:{backgroundColor:'#fff',borderRadius:16,padding:16,borderWidth:1,borderColor:'#CBDCDD',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardName:{fontFamily:'Inter_700Bold',fontSize:17,color:'#152A46'},cardMeta:{fontFamily:'Inter_400Regular',fontSize:12,color:'#607083',marginTop:4},right:{alignItems:'flex-end'},cardPrice:{fontFamily:'Inter_700Bold',fontSize:16,color:'#152A46'},cardSaving:{fontFamily:'Inter_600SemiBold',fontSize:12,color:'#58821D',marginTop:4},dev:{flexDirection:'row',gap:7,alignItems:'center',padding:4},devText:{flex:1,fontFamily:'Inter_400Regular',fontSize:11,color:'#607083'}
});
