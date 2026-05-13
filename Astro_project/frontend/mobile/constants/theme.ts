import { Platform } from 'react-native';

/**
 * Astro Theme Colors
 * Mirrors the web root variables:
 * --astro-bg: #05050a;
 * --astro-glass: rgba(255, 255, 255, 0.03);
 * --astro-border: rgba(255, 255, 255, 0.08);
 * --astro-glow: rgba(0, 242, 255, 0.3);
 */

const tintColorDark = '#00f2ff'; // Astro cyan glow

export const Colors = {
  light: {
    // We prioritize dark theme for Astro, but keeping light for compatibility
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#FFFFFF',
    background: '#05050a',
    tint: tintColorDark,
    icon: 'rgba(255, 255, 255, 0.4)',
    tabIconDefault: 'rgba(255, 255, 255, 0.4)',
    tabIconSelected: tintColorDark,
    glass: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(0, 242, 255, 0.3)',
    error: '#ff5252',
  },
};

export const Fonts = {
  header: 'Orbitron',
  subheader: 'Rajdhani',
  body: 'Inter',
};
