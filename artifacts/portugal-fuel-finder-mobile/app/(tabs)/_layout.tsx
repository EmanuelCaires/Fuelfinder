import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const icons: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  map: 'map',
  vehicle: 'truck',
  favourites: 'heart',
  settings: 'settings',
};

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedForeground,
      tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: '#fff', borderTopColor: colors.border },
      tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
      tabBarIcon: ({ color, size }) => <Feather name={icons[route.name] ?? 'circle'} size={size} color={color} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="vehicle" options={{ title: 'Veículo' }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favoritos' }} />
      <Tabs.Screen name="settings" options={{ title: 'Definições' }} />
    </Tabs>
  );
}
