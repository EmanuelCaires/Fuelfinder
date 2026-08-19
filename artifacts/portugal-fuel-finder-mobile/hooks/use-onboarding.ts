
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'fuelfinder:onboarding-complete:v1';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(value => setComplete(value === 'true'))
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(KEY, 'true');
    setComplete(true);
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setComplete(false);
  }, []);

  return { loading, complete, finish, reset };
}
