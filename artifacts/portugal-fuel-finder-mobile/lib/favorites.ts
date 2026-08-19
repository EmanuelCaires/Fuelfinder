import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fuelfinder:favorites:v1';

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(value => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  return ids.includes(id);
}

export async function setFavorite(id: string, value: boolean): Promise<string[]> {
  const ids = await getFavoriteIds();
  const next = value
    ? Array.from(new Set([...ids, id]))
    : ids.filter(existing => existing !== id);

  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const current = await isFavorite(id);
  await setFavorite(id, !current);
  return !current;
}
