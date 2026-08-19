import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FuelFinderDataError } from '../lib/data/errors';

export function DataStateBanner({
  loading,
  error,
  stale = false,
  providerName,
  onRetry,
}: {
  loading?: boolean;
  error?: FuelFinderDataError | null;
  stale?: boolean;
  providerName?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={[styles.banner, styles.info]}>
        <Feather name="refresh-cw" size={17} color="#527D83" />
        <Text style={styles.infoText}>A atualizar dados de {providerName ?? 'combustível'}…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.banner, styles.error]}>
        <Feather name="wifi-off" size={18} color="#A43E34" />
        <View style={{ flex: 1 }}>
          <Text style={styles.errorTitle}>Não foi possível atualizar os preços</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
        {error.retryable && onRetry ? (
          <Pressable style={styles.retry} onPress={onRetry}>
            <Text style={styles.retryText}>Tentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (stale) {
    return (
      <View style={[styles.banner, styles.warning]}>
        <Feather name="clock" size={18} color="#7B6410" />
        <Text style={styles.warningText}>
          Alguns preços podem estar desatualizados. Confirma a hora da última atualização.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  info: { backgroundColor: '#EAF5F5' },
  infoText: { flex: 1, color: '#527D83', fontSize: 13.5 },
  warning: { backgroundColor: '#FFF7D7' },
  warningText: { flex: 1, color: '#7B6410', fontSize: 13.5, lineHeight: 18 },
  error: { backgroundColor: '#FFF1EF' },
  errorTitle: { color: '#A43E34', fontSize: 13.5, fontWeight: '800' },
  errorText: { color: '#8C5A54', fontSize: 12.5, marginTop: 2 },
  retry: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retryText: { color: '#A43E34', fontWeight: '800', fontSize: 12 },
});
