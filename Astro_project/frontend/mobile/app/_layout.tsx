import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import {
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionStore } from '@/stores/sessionStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(user: string | null, loaded: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [user, segments, loaded]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const user = useSessionStore((state) => state.user);
  
  const [loaded] = useFonts({
    Orbitron: Orbitron_400Regular,
    'Orbitron-Bold': Orbitron_700Bold,
    Rajdhani: Rajdhani_400Regular,
    'Rajdhani-Medium': Rajdhani_500Medium,
    'Rajdhani-SemiBold': Rajdhani_600SemiBold,
    'Rajdhani-Bold': Rajdhani_700Bold,
    Inter: Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useProtectedRoute(user, loaded);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
