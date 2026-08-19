import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../hooks/use-onboarding';

export default function SplashScreen() {
  const { loading, complete } = useOnboarding();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      router.replace(complete ? '/(tabs)' : '/welcome');
    }, 1300);

    return () => clearTimeout(timer);
  }, [loading, complete]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Feather name="zap" size={54} color="#17345B" />
        </View>
        <Text style={styles.brand}>FuelFinder</Text>
        <Text style={styles.tagline}>Não abasteças sem comparar.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  logo: {
    width: 118,
    height: 118,
    borderRadius: 34,
    backgroundColor: '#B7F333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  brand: { fontSize: 46, fontWeight: '800', color: '#17345B' },
  tagline: { marginTop: 8, fontSize: 19, color: '#6C7A8E' },
});
