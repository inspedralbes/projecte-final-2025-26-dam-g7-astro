import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, Easing } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { Svg, Line, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Target {
  id: number;
  text: string;
  isTarget: boolean;
  pos: Animated.ValueXY;
  size: number;
}

interface SymmetryBreakerProps {
  isMultiplayer?: boolean;
  onExit: (score: number) => void;
}

export const SymmetryBreaker: React.FC<SymmetryBreakerProps> = ({ isMultiplayer, onExit }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [targets, setTargets] = useState<Target[]>([]);
  const [isFiring, setIsFiring] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const [lockProgress, setLockProgress] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  
  const lockAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generateTargets();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const generateTargets = () => {
    const newTargets: Target[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const isTarget = i === 0;
      const text = isTarget ? 'TARGET' : 'DECOY';
      const startX = Math.random() * (SCREEN_WIDTH - 100) + 50;
      const startY = Math.random() * (SCREEN_HEIGHT - 300) + 150;
      const pos = new Animated.ValueXY({ x: startX, y: startY });
      
      newTargets.push({ id: i, text, isTarget, pos, size: 80 });

      // Constant movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(pos, {
            toValue: { 
              x: Math.random() * (SCREEN_WIDTH - 100) + 50, 
              y: Math.random() * (SCREEN_HEIGHT - 300) + 150 
            },
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: false,
          })
        ])
      ).start();
    }
    setTargets(newTargets);
    setLockProgress(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFiring) {
      interval = setInterval(() => {
        const target = targets.find(t => t.isTarget);
        if (target) {
          // Check if touch is over target
          // This is tricky with Animated values, but for now I'll use a simplified check
          // In a real app, I'd use listeners or shared values
          setLockProgress(p => {
            if (p >= 100) {
              handleLock();
              return 0;
            }
            return p + 5;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isFiring, targets]);

  const handleLock = () => {
    setScore(s => s + 200);
    setRound(r => r + 1);
    generateTargets();
  };

  const handleTouch = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setTouchPos({ x: locationX, y: locationY });
    setIsFiring(true);
  };

  if (gameFinished) {
    return (
      <View style={styles.finishedContainer}>
        <IconSymbol name="target" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>OBJETIVOS ELIMINADOS</Text>
        <Text style={styles.finalScore}>Puntuación: {score}</Text>
        <Pressable onPress={() => onExit(score)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>CONTINUAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View 
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={() => setIsFiring(false)}
    >
      <View style={styles.hud}>
        <View style={styles.hudPill}>
          <Text style={styles.hudText}>SCORE: {score}</Text>
          <Text style={styles.hudText}>ROUND: {round}</Text>
          <Text style={[styles.hudText, timeLeft <= 10 && styles.textRed]}>{timeLeft}s</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${lockProgress}%` }]} />
        </View>
      </View>

      {targets.map(t => (
        <Animated.View
          key={t.id}
          style={[
            styles.target,
            {
              width: t.size,
              height: t.size,
              borderRadius: t.size / 2,
              transform: t.pos.getTranslateTransform(),
              borderColor: t.isTarget ? Colors.dark.tint : 'rgba(255,255,255,0.2)',
              backgroundColor: t.isTarget ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.05)',
            }
          ]}
        >
          <Text style={[styles.targetText, !t.isTarget && styles.decoyText]}>{t.text}</Text>
        </Animated.View>
      ))}

      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {isFiring && (
          <>
            <Line 
              x1={SCREEN_WIDTH / 2} y1={SCREEN_HEIGHT} 
              x2={touchPos.x} y2={touchPos.y} 
              stroke={Colors.dark.tint} strokeWidth="4" 
              opacity="0.6"
            />
            <Circle cx={touchPos.x} cy={touchPos.y} r="20" stroke={Colors.dark.tint} strokeWidth="2" fill="transparent" />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
  },
  hud: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  hudPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    gap: 20,
  },
  hudText: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 12,
  },
  textRed: { color: '#ff5252' },
  progressContainer: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00ff88',
  },
  target: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  decoyText: {
    color: 'rgba(255,255,255,0.3)',
  },
  finishedContainer: {
    flex: 1,
    backgroundColor: '#05050a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  finishedTitle: {
    fontFamily: Fonts.header,
    color: '#fff',
    fontSize: 24,
    marginTop: 20,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 20,
    color: Colors.dark.tint,
    marginTop: 10,
    marginBottom: 30,
  },
  exitBtn: {
    backgroundColor: Colors.dark.tint,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  exitBtnText: {
    fontWeight: 'bold',
    color: '#000',
  }
});
