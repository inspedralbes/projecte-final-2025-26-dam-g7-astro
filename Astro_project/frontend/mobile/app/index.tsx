import { Redirect } from 'expo-router';
import { useAstroStore } from '../stores/astroStore';

export default function Index() {
  const { user } = useAstroStore();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
