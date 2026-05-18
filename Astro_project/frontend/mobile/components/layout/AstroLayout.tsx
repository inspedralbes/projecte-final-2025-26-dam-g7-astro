import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import StarsBackground from '../ui/StarsBackground';

interface AstroLayoutProps {
  children: React.ReactNode;
}

export default function AstroLayout({ children }: AstroLayoutProps) {
  return (
    <LinearGradient
      colors={['#1a1a3a', '#05050a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
});
