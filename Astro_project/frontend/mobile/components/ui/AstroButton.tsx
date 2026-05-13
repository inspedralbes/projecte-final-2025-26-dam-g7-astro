import React from 'react';
import { StyleSheet, TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface AstroButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'glass';
  icon?: string;
  loading?: boolean;
}

export function AstroButton({ label, variant = 'primary', icon, loading, style, ...props }: AstroButtonProps) {
  const getColors = () => {
    switch (variant) {
      case 'primary': return [Colors.dark.tint, '#009dff'];
      case 'secondary': return ['#ffeb3b', '#fbc02d'];
      case 'danger': return ['#ff5252', '#d32f2f'];
      default: return ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'];
    }
  };

  const isGlass = variant === 'glass';

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      activeOpacity={0.8}
      {...props}
    >
      <LinearGradient
        colors={getColors() as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, isGlass && styles.glassBorder]}
      >
        <View style={styles.content}>
          {icon && !loading && (
            <MaterialCommunityIcons 
              name={icon as any} 
              size={18} 
              color={variant === 'glass' ? Colors.dark.tint : '#000'} 
            />
          )}
          <Text style={[
            styles.label, 
            variant === 'danger' && styles.labelWhite,
            variant === 'glass' && styles.labelTint
          ]}>
            {label.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.subheader,
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  labelWhite: {
    color: '#fff',
  },
  labelTint: {
    color: Colors.dark.tint,
  },
});
