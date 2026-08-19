import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getVehicle,
  removeVehicle,
  saveVehicle,
  type VehicleEnergyType,
  type VehicleV2,
} from '../../lib/vehicle';

const EMPTY: VehicleV2 = {
  version: 2,
  name: 'Meu carro',
  make: '',
  model: '',
  registration: '',
  energyType: 'diesel',
  tankLitres: 50,
  fuelConsumptionLPer100Km: 6.5,
  batteryKWh: 60,
  electricConsumptionKWhPer100Km: 16,
  preferredMode: 'fuel',
};

export default function VehicleScreen() {
  const [vehicle, setVehicle] = useState<VehicleV2>(EMPTY);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    getVehicle().then(existing => {
      if (existing) setVehicle({ ...EMPTY, ...existing });
    });
  }, []));

  const showFuelFields = vehicle.energyType === 'diesel' || vehicle.energyType === 'petrol' || vehicle.energyType === 'phev';
  const showElectricFields = vehicle.energyType === 'electric' || vehicle.energyType === 'phev';

  const valid = useMemo(() => {
    if (!vehicle.name.trim()) return false;

    if (showFuelFields) {
      if (!vehicle.tankLitres || vehicle.tankLitres <= 0) return false;
      if (!vehicle.fuelConsumptionLPer100Km || vehicle.fuelConsumptionLPer100Km <= 0) return false;
    }

    if (showElectricFields) {
      if (!vehicle.batteryKWh || vehicle.batteryKWh <= 0) return false;
      if (!vehicle.electricConsumptionKWhPer100Km || vehicle.electricConsumptionKWhPer100Km <= 0) return false;
    }

    return true;
  }, [vehicle, showFuelFields, showElectricFields]);

  const update = <K extends keyof VehicleV2>(key: K, value: VehicleV2[K]) => {
    setSaved(false);
    setVehicle(current => ({ ...current, [key]: value }));
  };

  const save = useCallback(async () => {
    if (!valid) {
      Alert.alert('Verifica os dados', 'Preenche os campos obrigatórios antes de guardar.');
      return;
    }

    await saveVehicle(vehicle);
    setSaved(true);
  }, [valid, vehicle]);

  const remove = useCallback(() => {
    Alert.alert(
      'Remover veículo?',
      'Os cálculos voltarão aos valores predefinidos até adicionares outro veículo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removeVehicle();
            setVehicle(EMPTY);
            setSaved(false);
          },
        },
      ],
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Meu veículo</Text>
        <Text style={styles.subtitle}>
          Personaliza os cálculos de combustível ou energia com os dados reais do teu veículo.
        </Text>

        <View style={styles.lookupCard}>
          <View style={styles.lookupIcon}>
            <Feather name="search" size={22} color="#17345B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lookupTitle}>Adicionar por matrícula</Text>
            <Text style={styles.lookupText}>
              A pesquisa automática será ligada a um fornecedor de dados automóvel. Por agora podes guardar a matrícula e confirmar tudo manualmente.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Identificação</Text>
        <View style={styles.card}>
          <Field label="Nome" value={vehicle.name} onChangeText={value => update('name', value)} placeholder="Meu carro" />
          <Field label="Marca" value={vehicle.make ?? ''} onChangeText={value => update('make', value)} placeholder="Peugeot" />
          <Field label="Modelo" value={vehicle.model ?? ''} onChangeText={value => update('model', value)} placeholder="308" />
          <Field
            label="Matrícula"
            value={vehicle.registration ?? ''}
            onChangeText={value => update('registration', value.toUpperCase())}
            placeholder="AB-12-CD"
            autoCapitalize="characters"
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Tipo de veículo</Text>
        <View style={styles.energyGrid}>
          <EnergyButton
            active={vehicle.energyType === 'diesel'}
            label="Diesel"
            icon="local-gas-station"
            onPress={() => update('energyType', 'diesel')}
          />
          <EnergyButton
            active={vehicle.energyType === 'petrol'}
            label="Gasolina"
            icon="local-gas-station"
            onPress={() => update('energyType', 'petrol')}
          />
          <EnergyButton
            active={vehicle.energyType === 'electric'}
            label="Elétrico"
            icon="electric-car"
            onPress={() => update('energyType', 'electric')}
          />
          <EnergyButton
            active={vehicle.energyType === 'phev'}
            label="Híbrido Plug-in"
            icon="ev-station"
            onPress={() => update('energyType', 'phev')}
          />
        </View>

        {vehicle.energyType === 'phev' && (
          <>
            <Text style={styles.sectionTitle}>Modo preferido</Text>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentItem, vehicle.preferredMode === 'fuel' && styles.segmentActive]}
                onPress={() => update('preferredMode', 'fuel')}
              >
                <Text style={[styles.segmentText, vehicle.preferredMode === 'fuel' && styles.segmentTextActive]}>Combustível</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentItem, vehicle.preferredMode === 'electric' && styles.segmentActive]}
                onPress={() => update('preferredMode', 'electric')}
              >
                <Text style={[styles.segmentText, vehicle.preferredMode === 'electric' && styles.segmentTextActive]}>Elétrico</Text>
              </Pressable>
            </View>
          </>
        )}

        {showFuelFields && (
          <>
            <Text style={styles.sectionTitle}>Combustível</Text>
            <View style={styles.card}>
              <NumericField
                label="Capacidade do depósito"
                value={vehicle.tankLitres}
                onChange={value => update('tankLitres', value)}
                suffix="L"
              />
              <NumericField
                label="Consumo médio"
                value={vehicle.fuelConsumptionLPer100Km}
                onChange={value => update('fuelConsumptionLPer100Km', value)}
                suffix="L/100 km"
                last
              />
            </View>
          </>
        )}

        {showElectricFields && (
          <>
            <Text style={styles.sectionTitle}>Bateria</Text>
            <View style={styles.card}>
              <NumericField
                label="Capacidade da bateria"
                value={vehicle.batteryKWh}
                onChange={value => update('batteryKWh', value)}
                suffix="kWh"
              />
              <NumericField
                label="Consumo médio"
                value={vehicle.electricConsumptionKWhPer100Km}
                onChange={value => update('electricConsumptionKWhPer100Km', value)}
                suffix="kWh/100 km"
                last
              />
            </View>

            <View style={styles.evNote}>
              <MaterialIcons name="electric-bolt" size={20} color="#17345B" />
              <Text style={styles.evNoteText}>
                O FuelFinder já guarda os dados necessários para EVs. Os preços €/kWh, potência e disponibilidade dos carregadores serão ligados quando adicionarmos o fornecedor de carregamento.
              </Text>
            </View>
          </>
        )}

        <Pressable
          style={[styles.saveButton, !valid && styles.saveDisabled]}
          onPress={save}
          disabled={!valid}
        >
          <Feather name={saved ? 'check' : 'save'} size={21} color="#17345B" />
          <Text style={styles.saveText}>{saved ? 'Guardado' : 'Guardar veículo'}</Text>
        </Pressable>

        <Pressable style={styles.removeButton} onPress={remove}>
          <Feather name="trash-2" size={18} color="#A43E34" />
          <Text style={styles.removeText}>Remover veículo guardado</Text>
        </Pressable>

        <View style={styles.footerNote}>
          <Feather name="shield" size={18} color="#527D83" />
          <Text style={styles.footerText}>
            Estes dados ficam guardados localmente no dispositivo nesta fase.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  last = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, !last && styles.fieldBorder]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0ABB8"
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function NumericField({
  label,
  value,
  onChange,
  suffix,
  last = false,
}: {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  suffix: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, !last && styles.fieldBorder]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numericWrap}>
        <TextInput
          style={styles.numericInput}
          keyboardType="decimal-pad"
          value={value !== undefined ? String(value) : ''}
          onChangeText={text => onChange(Number(text.replace(',', '.')) || 0)}
          placeholder="0"
          placeholderTextColor="#A0ABB8"
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function EnergyButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.energyButton, active && styles.energyActive]} onPress={onPress}>
      <MaterialIcons name={icon} size={25} color={active ? '#B7F333' : '#17345B'} />
      <Text style={[styles.energyText, active && styles.energyTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4FBFB' },
  content: { padding: 24, paddingTop: 54, paddingBottom: 140 },
  title: { fontSize: 40, fontWeight: '900', color: '#17345B' },
  subtitle: { marginTop: 4, color: '#6C7A8E', fontSize: 17, lineHeight: 23 },
  lookupCard: {
    marginTop: 24, padding: 18, borderRadius: 22, backgroundColor: '#EAFBB2',
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
  },
  lookupIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  lookupTitle: { color: '#17345B', fontWeight: '900', fontSize: 17 },
  lookupText: { color: '#53663A', fontSize: 13.5, lineHeight: 19, marginTop: 4 },
  sectionTitle: { marginTop: 27, marginBottom: 11, color: '#17345B', fontSize: 19, fontWeight: '900' },
  card: {
    backgroundColor: 'white', borderRadius: 22, borderWidth: 1,
    borderColor: '#D8E4E4', overflow: 'hidden',
  },
  fieldRow: { padding: 17 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#E6EEEE' },
  label: { color: '#6C7A8E', fontSize: 13.5, marginBottom: 7 },
  input: { color: '#17345B', fontWeight: '700', fontSize: 17, padding: 0 },
  numericWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numericInput: { color: '#17345B', fontWeight: '800', fontSize: 19, padding: 0, minWidth: 80 },
  suffix: { color: '#6C7A8E', fontSize: 14 },
  energyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  energyButton: {
    width: '48%', minHeight: 88, borderRadius: 20, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#D8E4E4', alignItems: 'center',
    justifyContent: 'center', gap: 7, padding: 10,
  },
  energyActive: { backgroundColor: '#17345B', borderColor: '#17345B' },
  energyText: { color: '#17345B', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  energyTextActive: { color: 'white' },
  segment: { flexDirection: 'row', backgroundColor: '#DDEEEE', borderRadius: 17, padding: 5 },
  segmentItem: { flex: 1, borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: '#17345B' },
  segmentText: { color: '#6C7A8E', fontWeight: '700' },
  segmentTextActive: { color: '#EAFBB2' },
  evNote: {
    marginTop: 14, borderRadius: 16, padding: 14, backgroundColor: '#F2FFD2',
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  evNoteText: { flex: 1, color: '#53663A', lineHeight: 19, fontSize: 13 },
  saveButton: {
    marginTop: 28, borderRadius: 18, paddingVertical: 16, backgroundColor: '#B7F333',
    flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#17345B', fontSize: 17, fontWeight: '900' },
  removeButton: {
    marginTop: 12, borderRadius: 18, paddingVertical: 15, backgroundColor: '#FFF5F4',
    borderWidth: 1, borderColor: '#F0C8C4', flexDirection: 'row', gap: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#A43E34', fontWeight: '800' },
  footerNote: { marginTop: 20, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: '#6C7A8E', fontSize: 12.5 },
});
