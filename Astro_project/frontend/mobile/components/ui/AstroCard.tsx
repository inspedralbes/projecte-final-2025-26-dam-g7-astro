import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';

interface AstroCardProps extends ViewProps {
  intensity?: number;
  glow?: boolean;
}

export function AstroCard({ children, style, intensity = 20, glow = false, ...props }: AstroCardProps) {
  return (
    <View style={[styles.outer, glow && styles.glow, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur} {...props}>
        <View style={styles.inner}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glow: {
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  blur: {
    width: '100%',
  },
  inner: {
    padding: 20,
  },
});
