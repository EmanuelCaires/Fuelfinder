import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'pt' | 'en';
export type DefaultEnergy = 'diesel' | 'petrol' | 'electric';

export type AppPreferences = {
  language: AppLanguage;
  defaultEnergy: DefaultEnergy;
};

export const PREFERENCES_KEY = 'fuelfinder:preferences:v1';

export const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'pt',
  defaultEnergy: 'diesel',
};

export async function getPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}
