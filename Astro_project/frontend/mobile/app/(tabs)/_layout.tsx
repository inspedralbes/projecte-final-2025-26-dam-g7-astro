import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: Colors[colorScheme].border,
          height: 60,
          paddingBottom: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="home-variant" color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'TRAINING',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="brain" color={color} />,
        }}
      />
      <Tabs.Screen
        name="multiplayer"
        options={{
          title: 'MULTI',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="sword-cross" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'SHOP',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="store" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'SOCIAL',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="account-group" color={color} />,
        }}
      />
    </Tabs>
  );
}
