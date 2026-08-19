
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../hooks/use-onboarding';

export default function WelcomeScreen() {
  const { finish } = useOnboarding();

  async function start() {
    await finish();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Feather name="zap" size={42} color="#17345B" />
        </View>

        <Text style={styles.brand}>FuelFinder</Text>
        <Text style={styles.tagline}>Não abasteças sem comparar.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Feather name="map-pin" size={24} color="#17345B" />
            <View style={styles.copy}>
              <Text style={styles.title}>Encontra combustível mais barato</Text>
              <Text style={styles.body}>Usa a tua localização para comparar postos perto de ti.</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Feather name="truck" size={24} color="#17345B" />
            <View style={styles.copy}>
              <Text style={styles.title}>Poupança ajustada ao teu carro</Text>
              <Text style={styles.body}>Depósito e consumo entram no cálculo da poupança real.</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Feather name="navigation" size={24} color="#17345B" />
            <View style={styles.copy}>
              <Text style={styles.title}>Vai direto ao melhor posto</Text>
              <Text style={styles.body}>Compara preço, distância e custo da viagem antes de abastecer.</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.button} onPress={start}>
          <Text style={styles.buttonText}>Começar</Text>
          <Feather name="arrow-right" size={22} color="#17345B" />
        </Pressable>

        <Text style={styles.note}>Portugal primeiro. Preparado para outros países.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  logoCircle: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#B7F333',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  brand: { fontSize: 44, lineHeight: 50, fontWeight: '800', color: '#17345B' },
  tagline: { fontSize: 22, color: '#6C7A8E', marginTop: 6, marginBottom: 28 },
  card: {
    backgroundColor: 'white', borderRadius: 28, padding: 22, gap: 24,
    borderWidth: 1, borderColor: '#D8E4E4',
  },
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  copy: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#17345B' },
  body: { marginTop: 4, fontSize: 15.5, lineHeight: 22, color: '#6C7A8E' },
  button: {
    marginTop: 28, height: 60, borderRadius: 18, backgroundColor: '#B7F333',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
  },
  buttonText: { fontSize: 20, fontWeight: '800', color: '#17345B' },
  note: { textAlign: 'center', color: '#7B8796', marginTop: 16, fontSize: 13 },
});
