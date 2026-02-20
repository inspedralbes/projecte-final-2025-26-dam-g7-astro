import { Stack } from "expo-router";
import { useEffect } from "react";
import { hydrateStore } from "../stores/astroStore";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
