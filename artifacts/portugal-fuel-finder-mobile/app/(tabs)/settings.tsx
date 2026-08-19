import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences,
  type AppLanguage,
  type AppPreferences,
  type DefaultEnergy,
} from '../../lib/preferences';

const ONBOARDING_KEY = 'fuelfinder:onboarding-complete:v1';
const VEHICLE_KEY = 'fuelfinder:vehicle:v1';
const FAVORITES_KEY = 'fuelfinder:favorites:v1';

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const load = useCallback(async () => {
    const saved = await getPreferences();
    setPreferences(saved);

    const permission = await Location.getForegroundPermissionsAsync();
    setLocationStatus(permission.status);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const updateLanguage = useCallback(async (language: AppLanguage) => {
    const next = { ...preferences, language };
    setPreferences(next);
    await savePreferences(next);
  }, [preferences]);

  const updateEnergy = useCallback(async (defaultEnergy: DefaultEnergy) => {
    const next = { ...preferences, defaultEnergy };
    setPreferences(next);
    await savePreferences(next);
  }, [preferences]);

  const requestLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(permission.status);

    if (permission.status !== 'granted') {
      Alert.alert(
        'Localização não autorizada',
        'Podes alterar a permissão nas definições do sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir definições', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, []);

  const replayWelcome = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    router.push('/welcome');
  }, []);

  const clearLocalData = useCallback(() => {
    Alert.alert(
      'Apagar dados locais?',
      'Isto remove o veículo guardado, favoritos e preferências deste dispositivo. Não pode ser desfeito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              VEHICLE_KEY,
              FAVORITES_KEY,
              ONBOARDING_KEY,
              'fuelfinder:preferences:v1',
            ]);
            setPreferences(DEFAULT_PREFERENCES);
            setNotificationsEnabled(false);
            router.replace('/welcome');
          },
        },
      ],
    );
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Definições</Text>
      <Text style={styles.subtitle}>Personaliza o FuelFinder e controla os teus dados.</Text>

      <Section title="Preferências">
        <SettingRow
          icon="globe"
          title="Idioma"
          subtitle="Português agora; preparado para expansão internacional"
        />
        <Segmented
          options={[
            { key: 'pt', label: 'Português' },
            { key: 'en', label: 'English' },
          ]}
          value={preferences.language}
          onChange={value => updateLanguage(value as AppLanguage)}
        />

        <Divider />

        <SettingRow
          icon="droplet"
          title="Energia predefinida"
          subtitle="Usado quando não existe um veículo selecionado"
        />
        <Segmented
          options={[
            { key: 'diesel', label: 'Diesel' },
            { key: 'petrol', label: 'Gasolina' },
            { key: 'electric', label: 'Elétrico' },
          ]}
          value={preferences.defaultEnergy}
          onChange={value => updateEnergy(value as DefaultEnergy)}
          compact
        />
        {preferences.defaultEnergy === 'electric' && (
          <View style={styles.evNote}>
            <MaterialIcons name="electric-bolt" size={18} color="#17345B" />
            <Text style={styles.evNoteText}>
              O modo EV está preparado nas preferências. A pesquisa de carregadores será ligada numa próxima fase.
            </Text>
          </View>
        )}
      </Section>

      <Section title="Localização">
        <Pressable style={styles.actionRow} onPress={requestLocation}>
          <View style={styles.iconBox}>
            <Feather name="map-pin" size={20} color="#17345B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Permissão de localização</Text>
            <Text style={styles.rowSubtitle}>
              {locationStatus === 'granted'
                ? 'Ativa — FuelFinder pode encontrar postos perto de ti'
                : locationStatus === 'denied'
                ? 'Desativada — toca para tentar novamente'
                : 'Ainda não decidida'}
            </Text>
          </View>
          <View style={[styles.statusPill, locationStatus === 'granted' && styles.statusPillGood]}>
            <Text style={styles.statusText}>
              {locationStatus === 'granted' ? 'ATIVA' : 'VERIFICAR'}
            </Text>
          </View>
        </Pressable>
      </Section>

      <Section title="Conta e veículo">
        <Pressable style={styles.actionRow} onPress={() => router.push('/(tabs)/vehicle')}>
          <View style={styles.iconBox}>
            <Feather name="truck" size={20} color="#17345B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Meu veículo</Text>
            <Text style={styles.rowSubtitle}>Matrícula, combustível, depósito e consumo</Text>
          </View>
          <Feather name="chevron-right" size={22} color="#7B8796" />
        </Pressable>

        <Divider />

        <View style={styles.actionRow}>
          <View style={styles.iconBox}>
            <Feather name="bell" size={20} color="#17345B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Alertas de preço</Text>
            <Text style={styles.rowSubtitle}>Preparado para quando ligarmos notificações</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D8E4E4', true: '#B7F333' }}
            thumbColor="#17345B"
          />
        </View>
      </Section>

      <Section title="Experiência">
        <Pressable style={styles.actionRow} onPress={replayWelcome}>
          <View style={styles.iconBox}>
            <Feather name="play-circle" size={20} color="#17345B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Ver introdução novamente</Text>
            <Text style={styles.rowSubtitle}>Abre o ecrã de boas-vindas sem apagar os teus dados</Text>
          </View>
          <Feather name="chevron-right" size={22} color="#7B8796" />
        </Pressable>
      </Section>

      <Section title="Privacidade">
        <View style={styles.privacyBlock}>
          <Feather name="shield" size={22} color="#17345B" />
          <Text style={styles.privacyText}>
            Neste momento, veículo, favoritos e preferências ficam guardados localmente no teu dispositivo.
            FuelFinder usa a localização para calcular postos e distâncias próximas.
          </Text>
        </View>

        <Pressable style={styles.dangerButton} onPress={clearLocalData}>
          <Feather name="trash-2" size={19} color="#A43E34" />
          <Text style={styles.dangerText}>Apagar dados locais</Text>
        </Pressable>
      </Section>

      <Section title="Sobre">
        <InfoLine label="Aplicação" value="FuelFinder" />
        <InfoLine label="Versão" value={appVersion} />
        <InfoLine label="Mercado inicial" value="Portugal" />
        <InfoLine label="Dados de combustível" value="DGEG — acesso pendente" />
        <InfoLine label="Plataformas" value="Android + iOS" last />
      </Section>

      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <Feather name="zap" size={22} color="#17345B" />
        </View>
        <Text style={styles.footerBrand}>FuelFinder</Text>
        <Text style={styles.footerTagline}>Não abasteças sem comparar.</Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.section}>{children}</View>
    </>
  );
}

function SettingRow({ icon, title, subtitle }: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.settingHeader}>
      <View style={styles.iconBox}><Feather name={icon} size={20} color="#17345B" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Segmented({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.segment, compact && styles.segmentCompact]}>
      {options.map(option => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            style={[styles.segmentItem, active && styles.segmentActive]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function InfoLine({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoLine, !last && styles.infoLineBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 24, paddingTop: 54, paddingBottom: 130 },
  title: { fontSize: 40, fontWeight: '900', color: '#17345B' },
  subtitle: { marginTop: 4, color: '#6C7A8E', fontSize: 17, lineHeight: 23 },
  sectionTitle: { marginTop: 28, marginBottom: 10, color: '#17345B', fontSize: 18, fontWeight: '800' },
  section: { backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#D8E4E4', padding: 18 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 58 },
  iconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EAFBB2', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: '#17345B', fontSize: 16.5, fontWeight: '800' },
  rowSubtitle: { color: '#6C7A8E', fontSize: 13.5, marginTop: 3, lineHeight: 18 },
  segment: { marginTop: 14, flexDirection: 'row', backgroundColor: '#E6F0F0', borderRadius: 15, padding: 4 },
  segmentCompact: { marginTop: 12 },
  segmentItem: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { color: '#6C7A8E', fontWeight: '700', fontSize: 14 },
  segmentTextActive: { color: '#EAFBB2' },
  divider: { height: 1, backgroundColor: '#E5EEEE', marginVertical: 17 },
  statusPill: { backgroundColor: '#FFF7D7', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  statusPillGood: { backgroundColor: '#EAFBB2' },
  statusText: { color: '#17345B', fontSize: 10.5, fontWeight: '900' },
  evNote: { marginTop: 13, padding: 12, borderRadius: 13, backgroundColor: '#F2FFD2', flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  evNoteText: { flex: 1, color: '#53663A', fontSize: 12.5, lineHeight: 17 },
  privacyBlock: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  privacyText: { flex: 1, color: '#5F6E80', fontSize: 14, lineHeight: 20 },
  dangerButton: { marginTop: 18, borderWidth: 1, borderColor: '#F0C8C4', backgroundColor: '#FFF5F4', borderRadius: 15, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dangerText: { color: '#A43E34', fontWeight: '800' },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
  infoLineBorder: { borderBottomWidth: 1, borderBottomColor: '#E6EEEE' },
  infoLabel: { color: '#6C7A8E', fontSize: 14 },
  infoValue: { flex: 1, textAlign: 'right', color: '#17345B', fontWeight: '700', fontSize: 14 },
  footer: { alignItems: 'center', paddingTop: 34, paddingBottom: 10 },
  footerLogo: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#B7F333', alignItems: 'center', justifyContent: 'center' },
  footerBrand: { marginTop: 10, color: '#17345B', fontWeight: '900', fontSize: 19 },
  footerTagline: { color: '#7B8796', marginTop: 3, fontSize: 12.5 },
});
