import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Animated, Easing, Dimensions, Pressable } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { Svg, Polygon, Line, Defs, RadialGradient, Stop, G, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAR_SIZE = SCREEN_WIDTH * 0.9;
const STAR_CENTER = STAR_SIZE / 2;
const STAR_RADIUS = (STAR_SIZE / 2) - 20;
const INNER_RADIUS = STAR_RADIUS * 0.45;

interface SpelledRoscoProps {
  isMultiplayer?: boolean;
  isRace?: boolean;
  isPaused?: boolean;
  onExit: (reward: number) => void;
}

export const SpelledRosco: React.FC<SpelledRoscoProps> = ({
  isMultiplayer = false,
  isRace = false,
  isPaused = false,
  onExit,
}) => {
  const multiplayerStore = useMultiplayerStore();
  const sessionStore = useSessionStore();

  const [roscoLetters, setRoscoLetters] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rawInput, setRawInput] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showFeedback, setShowFeedback] = useState<null | 'success' | 'error'>(null);

  const subRole = multiplayerStore.subRole;

  // State initialization (MOCK for now, should use real data)
  useEffect(() => {
    // Ported logic from web for initialization
    const initialData = Array.from({ length: 25 }, (_, i) => ({
      char: String.fromCharCode(65 + i),
      question: `Question for ${String.fromCharCode(65 + i)}`,
      answer: 'ANSWER',
      status: 'pending'
    }));
    setRoscoLetters(initialData);
  }, []);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && !gameFinished) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, gameFinished]);

  const currentLetter = roscoLetters[currentIndex] || { char: '?', question: '', answer: '' };

  const handleResult = (status: 'correct' | 'incorrect') => {
    const newLetters = [...roscoLetters];
    newLetters[currentIndex].status = status;
    setRoscoLetters(newLetters);

    if (status === 'correct') {
      setScore(s => s + 100);
      setTimeLeft(t => t + 20);
      setShowFeedback('success');
      
      if (isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'ROSCO_ANSWER',
          index: currentIndex,
          status: 'correct',
          scoreGained: 100
        });
      }
    } else {
      setShowFeedback('error');
      if (isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'ROSCO_ANSWER',
          index: currentIndex,
          status: 'incorrect',
          scoreGained: 0
        });
      }
    }

    setTimeout(() => {
      setShowFeedback(null);
      setRawInput('');
      advanceTurn();
    }, 1000);
  };

  useEffect(() => {
    if (isMultiplayer && multiplayerStore.lastMessage?.type === 'GAME_ACTION') {
      const { action, from } = multiplayerStore.lastMessage;
      if (action.type === 'ROSCO_ANSWER' && from !== sessionStore.user) {
        const newLetters = [...roscoLetters];
        if (newLetters[action.index]) {
          newLetters[action.index].status = action.status;
          setRoscoLetters(newLetters);
        }
      }
    }
  }, [multiplayerStore.lastMessage]);

  const advanceTurn = () => {
    let next = (currentIndex + 1) % roscoLetters.length;
    let loops = 0;
    while (roscoLetters[next]?.status !== 'pending' && loops < roscoLetters.length) {
      next = (next + 1) % roscoLetters.length;
      loops++;
    }
    if (loops >= roscoLetters.length) {
      setGameFinished(true);
    } else {
      setCurrentIndex(next);
    }
  };

  const starPoints = useMemo(() => {
    const totalPoints = 25 * 2;
    return Array.from({ length: totalPoints }, (_, i) => {
      const angle = (i * (360 / totalPoints) - 90) * (Math.PI / 180);
      const r = i % 2 === 0 ? STAR_RADIUS : INNER_RADIUS;
      return { x: STAR_CENTER + Math.cos(angle) * r, y: STAR_CENTER + Math.sin(angle) * r };
    });
  }, []);

  if (gameFinished) {
    return (
      <View style={styles.finishedCard}>
        <IconSymbol name="checkmark.circle.fill" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>MISIÓN COMPLETADA</Text>
        <Text style={styles.finalScore}>Puntuación: {score}</Text>
        <Pressable onPress={() => onExit(score)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>CONTINUAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{i18n.t('spelledRosco.title')}</Text>
          <Text style={styles.stats}>Score: {score} | Time: {timeLeft}s</Text>
        </View>
        <Pressable onPress={() => onExit(0)}>
          <IconSymbol name="xmark" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.starContainer}>
        <Svg width={STAR_SIZE} height={STAR_SIZE}>
          <Defs>
            <RadialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={Colors.dark.tint} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={Colors.dark.tint} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {roscoLetters.map((_, i) => {
            const p1 = starPoints[(i * 2 + 49) % 50];
            const p2 = starPoints[i * 2];
            const p3 = starPoints[(i * 2 + 1) % 50];
            const points = `${STAR_CENTER},${STAR_CENTER} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
            return (
              <Polygon
                key={i}
                points={points}
                fill={i === currentIndex ? 'url(#tipGlow)' : 'rgba(0, 242, 255, 0.05)'}
              />
            );
          })}
          {starPoints.map((p, i) => {
            const next = starPoints[(i + 1) % 50];
            return (
              <Line
                key={i}
                x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                stroke={i / 2 === currentIndex ? Colors.dark.tint : 'rgba(0, 242, 255, 0.2)'}
                strokeWidth={i / 2 === currentIndex ? 4 : 2}
              />
            );
          })}
        </Svg>

        {roscoLetters.map((l, i) => {
          const p = starPoints[i * 2];
          return (
            <View 
              key={i} 
              style={[
                styles.node, 
                { left: p.x - 15, top: p.y - 15 },
                l.status === 'correct' && styles.nodeCorrect,
                l.status === 'incorrect' && styles.nodeIncorrect,
                i === currentIndex && styles.nodeActive
              ]}
            >
              <Text style={styles.nodeChar}>{l.char}</Text>
            </View>
          );
        })}

        <View style={styles.centerCircle}>
          <Text style={styles.centerChar}>{currentLetter.char}</Text>
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentLetter.question}</Text>
        
        <TextInput
          style={styles.input}
          value={rawInput}
          onChangeText={setRawInput}
          placeholder={i18n.t('spelledRosco.placeholder')}
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="characters"
        />

        <View style={styles.btnRow}>
          <Pressable style={styles.pasapalabraBtn} onPress={advanceTurn}>
            <Text style={styles.pasapalabraText}>PASAPALABRA</Text>
          </Pressable>
          <Pressable 
            style={[styles.confirmBtn, !rawInput && styles.btnDisabled]} 
            onPress={() => handleResult('correct')} // Simplified check for now
            disabled={!rawInput}
          >
            <Text style={styles.confirmText}>CONFIRMAR</Text>
          </Pressable>
        </View>
      </View>

      {showFeedback && (
        <View style={[styles.feedbackOverlay, showFeedback === 'success' ? styles.successBg : styles.errorBg]}>
          <IconSymbol 
            name={showFeedback === 'success' ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
            size={120} 
            color="#fff" 
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#05050a',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  title: {
    fontFamily: Fonts.header,
    color: Colors.dark.tint,
    fontSize: 18,
  },
  stats: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  starContainer: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: 'relative',
    marginBottom: 30,
  },
  node: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  nodeActive: {
    borderColor: Colors.dark.tint,
    borderWidth: 2,
    transform: [{ scale: 1.2 }],
  },
  nodeCorrect: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  nodeIncorrect: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  nodeChar: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerCircle: {
    position: 'absolute',
    left: STAR_CENTER - 40,
    top: STAR_CENTER - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
  },
  centerChar: {
    fontFamily: Fonts.header,
    fontSize: 40,
    color: Colors.dark.tint,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  questionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: Fonts.header,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pasapalabraBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 171, 64, 0.2)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffab40',
  },
  pasapalabraText: {
    color: '#ffab40',
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  successBg: { backgroundColor: 'rgba(5, 150, 105, 0.8)' },
  errorBg: { backgroundColor: 'rgba(220, 38, 38, 0.8)' },
  finishedCard: {
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
