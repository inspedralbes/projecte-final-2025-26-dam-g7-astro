import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/i18n';

const ITEM_HEIGHT = 100;

interface RouletteOverlayProps {
  show: boolean;
  targetGame: string;
  games: string[];
  onFinished: () => void;
}

export const RouletteOverlay: React.FC<RouletteOverlayProps> = ({
  show,
  targetGame,
  games,
  onFinished,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const reelAnim = useRef(new Animated.Value(0)).current;

  const extendedGames = useMemo(() => {
    return [...games, ...games, ...games, ...games];
  }, [games]);

  useEffect(() => {
    if (show) {
      reelAnim.setValue(0);
      startSpin();
    }
  }, [show]);

  const startSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const targetIndex = games.indexOf(targetGame);
    const extraLaps = 2;
    const finalIndex = (extraLaps * games.length) + targetIndex;

    Animated.timing(reelAnim, {
      toValue: -(finalIndex * ITEM_HEIGHT),
      duration: 2000,
      easing: Easing.bezier(0.15, 0, 0.15, 1),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setTimeout(onFinished, 500);
    });
  };

  const getGameIcon = (name: string) => {
    const icons: Record<string, string> = {
      RadarScan: 'radar',
      RadioSignal: 'waveform',
      RhymeSquad: 'mic.fill',
      SpelledRosco: 'text.bubble',
      SymmetryBreaker: 'selection.pin.in.out',
      WordConstruction: 'hammer.fill',
    };
    return (icons[name] || 'gamecontroller.fill') as any;
  };

  if (!show) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.container}>
        <Text style={styles.title}>SELECCIONANDO MISIÓN</Text>
        
        <View style={styles.slotWindow}>
          <Animated.View style={[styles.reel, { transform: [{ translateY: reelAnim }] }]}>
            {extendedGames.map((game, i) => (
              <View key={i} style={styles.slotItem}>
                <IconSymbol 
                  name={getGameIcon(game)} 
                  size={32} 
                  color={!isSpinning && game === targetGame ? Colors.dark.tint : '#fff'} 
                />
                <Text style={[
                  styles.gameName,
                  !isSpinning && game === targetGame && styles.selectedText
                ]}>
                  {game.toUpperCase()}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={styles.progressBar} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: 'rgba(10, 25, 41, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.tint,
    elevation: 20,
  },
  title: {
    fontFamily: Fonts.header,
    color: Colors.dark.tint,
    fontSize: 18,
    letterSpacing: 4,
    marginBottom: 30,
    textAlign: 'center',
  },
  slotWindow: {
    height: ITEM_HEIGHT,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reel: {
    flexDirection: 'column',
  },
  slotItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gameName: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedText: {
    color: Colors.dark.tint,
    textShadowColor: 'rgba(0, 242, 255, 0.5)',
    textShadowRadius: 10,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.dark.tint,
  },
});
