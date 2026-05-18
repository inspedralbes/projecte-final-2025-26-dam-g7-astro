import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, Pressable } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlobalAnomalyManagerProps {
  forcedAnomaly?: string | null;
}

interface Meteor {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  rotation: Animated.Value;
}

export const GlobalAnomalyManager: React.FC<GlobalAnomalyManagerProps> = ({ forcedAnomaly }) => {
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [clickDisabled, setClickDisabled] = useState(false);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (forcedAnomaly) {
      triggerAnomaly(forcedAnomaly);
    } else {
      setActiveAnomaly(null);
      setMeteors([]);
    }
  }, [forcedAnomaly]);

  const triggerAnomaly = (type: string) => {
    setActiveAnomaly(type);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    if (type === 'meteorits') startMeteorRain();
    
    // Auto-remove if not forced (simulated)
    if (!forcedAnomaly) {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setActiveAnomaly(null));
      }, 8000);
    }
  };

  const startMeteorRain = () => {
    const meteorInterval = setInterval(() => {
      const id = Date.now();
      const startX = Math.random() * SCREEN_WIDTH;
      const xAnim = new Animated.Value(startX);
      const yAnim = new Animated.Value(-100);
      const rotAnim = new Animated.Value(0);
      const size = 40 + Math.random() * 40;

      const newMeteor: Meteor = { id, x: xAnim, y: yAnim, size, rotation: rotAnim };
      setMeteors(prev => [...prev, newMeteor]);

      Animated.parallel([
        Animated.timing(yAnim, {
          toValue: SCREEN_HEIGHT + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotAnim, {
          toValue: 360,
          duration: 3000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setMeteors(prev => prev.filter(m => m.id !== id));
      });
    }, 1500);

    return () => clearInterval(meteorInterval);
  };

  const onMeteorHit = () => {
    if (clickDisabled) return;
    setClickDisabled(true);
    setTimeout(() => setClickDisabled(false), 2000);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {activeAnomaly === 'nebulosa' && (
        <Animated.View style={[styles.nebulosa, { opacity: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.4]
        }) }]} />
      )}

      {activeAnomaly === 'meteorits' && meteors.map(m => (
        <Animated.View
          key={m.id}
          style={[
            styles.meteor,
            {
              width: m.size,
              height: m.size,
              transform: [
                { translateX: m.x },
                { translateY: m.y },
                { rotate: m.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                }) }
              ]
            }
          ]}
        >
          <Pressable onPress={onMeteorHit} style={styles.meteorPressable}>
            <Image 
              source={{ uri: 'https://raw.githubusercontent.com/Biel-astro/Astro-project/main/frontend/web/public/sci_fi_meteorite_fire_1778453762296.png' }} 
              style={styles.meteorImg} 
            />
          </Pressable>
        </Animated.View>
      ))}

      {clickDisabled && (
        <View style={styles.clickBlocker}>
          <IconSymbol name="lock.fill" size={64} color="#ff5252" />
          <Text style={styles.blockerText}>¡SISTEMAS BLOQUEADOS!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  nebulosa: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8a2be2',
  },
  meteor: {
    position: 'absolute',
  },
  meteorPressable: {
    width: '100%',
    height: '100%',
  },
  meteorImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  clickBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  blockerText: {
    color: '#ff5252',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
