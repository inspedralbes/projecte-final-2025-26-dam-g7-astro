import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import i18n from '@/i18n';

interface FuelBarProps {
  fuel: number;
}

export const FuelBar: React.FC<FuelBarProps> = ({ fuel }) => {
  const animatedWidth = useRef(new Animated.Value(fuel)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: fuel,
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [fuel]);

  useEffect(() => {
    if (fuel < 25) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.2, duration: 250, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      blinkAnim.setValue(1);
    }
  }, [fuel < 25]);

  const fuelColor = useMemo(() => {
    if (fuel > 60) return ['#00e5ff', '#00b0ff'];
    if (fuel > 25) return ['#ffab40', '#ff9100'];
    return ['#ff5252', '#d50000'];
  }, [fuel]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={{ opacity: fuel < 25 ? blinkAnim : 1 }}>
          <IconSymbol name="fuelpump.fill" size={18} color={fuel < 25 ? '#ff5252' : '#00e5ff'} />
        </Animated.View>
        <Text style={styles.label}>{i18n.t('multiplayerLobby.fuel') || 'COMBUSTIBLE QUÀNTIC'}</Text>
        <Text style={styles.percent}>{Math.round(fuel)}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.fill, 
            { 
              width: widthStyle, 
              backgroundColor: fuelColor[0],
              transform: [{ scale: fuel < 25 ? pulseAnim : 1 }]
            }
          ]}
        >
          <View style={styles.glow} />
        </Animated.View>

        {fuel < 25 && (
          <Animated.View style={[styles.warningOverlay, { opacity: blinkAnim }]}>
            <Text style={styles.warningText}>
              {i18n.t('multiplayerLobby.lowFuel') || '¡COMBUSTIBLE CRÍTICO!'}
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  percent: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '800',
    color: '#00e5ff',
    fontFamily: 'monospace',
  },
  track: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  warningOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
