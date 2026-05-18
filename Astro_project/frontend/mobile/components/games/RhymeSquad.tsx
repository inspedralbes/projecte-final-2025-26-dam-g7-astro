import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, Easing } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WordItem {
  id: number;
  text: string;
  isRhyme: boolean;
  x: number;
  anim: Animated.Value;
  status: 'falling' | 'correct' | 'incorrect';
}

interface RhymeSquadProps {
  isMultiplayer?: boolean;
  onExit: (score: number) => void;
}

export const RhymeSquad: React.FC<RhymeSquadProps> = ({ isMultiplayer, onExit }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeWords, setActiveWords] = useState<WordItem[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [targetWord, setTargetWord] = useState('ESTRELLA'); // Mock target

  const wordIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const spawnWord = useCallback(() => {
    const isRhyme = Math.random() < 0.4;
    const text = isRhyme ? 'BELLA' : 'CASA'; // Mock words
    const x = Math.random() * (SCREEN_WIDTH - 100) + 10;
    const anim = new Animated.Value(-100);
    const id = wordIdRef.current++;

    const newWord: WordItem = { id, text, isRhyme, x, anim, status: 'falling' };
    setActiveWords(prev => [...prev, newWord]);

    Animated.timing(anim, {
      toValue: SCREEN_HEIGHT + 100,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveWords(prev => {
          const word = prev.find(w => w.id === id);
          if (word && word.isRhyme && word.status === 'falling') {
            setLives(l => Math.max(0, l - 1));
          }
          return prev.filter(w => w.id !== id);
        });
      }
    });
  }, []);

  useEffect(() => {
    gameLoopRef.current = setInterval(spawnWord, 1500);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (lives <= 0) setGameFinished(true);
  }, [lives]);

  const handleWordPress = (word: WordItem) => {
    if (word.status !== 'falling') return;

    if (word.isRhyme) {
      setScore(s => s + 100);
      setActiveWords(prev => prev.map(w => w.id === word.id ? { ...w, status: 'correct' } : w));
    } else {
      setLives(l => Math.max(0, l - 1));
      setActiveWords(prev => prev.map(w => w.id === word.id ? { ...w, status: 'incorrect' } : w));
    }

    setTimeout(() => {
      setActiveWords(prev => prev.filter(w => w.id !== word.id));
    }, 300);
  };

  if (gameFinished) {
    return (
      <View style={styles.finishedContainer}>
        <IconSymbol name="timer.circle.fill" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>MISIÓN FINALIZADA</Text>
        <Text style={styles.finalScore}>Puntuación: {score}</Text>
        <Pressable onPress={() => onExit(score)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>CONTINUAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.targetBox}>
          <Text style={styles.targetLabel}>RIMA AMB:</Text>
          <Text style={styles.targetWord}>{targetWord}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>LIVES</Text>
          <View style={styles.livesRow}>
            {[1, 2, 3].map(i => (
              <IconSymbol 
                key={i} 
                name={i <= lives ? "heart.fill" : "heart"} 
                size={16} 
                color={i <= lives ? "#ff5252" : "#444"} 
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.playArea}>
        {activeWords.map(word => (
          <Animated.View
            key={word.id}
            style={[
              styles.wordBubble,
              { left: word.x, transform: [{ translateY: word.anim }] },
              word.status === 'correct' && styles.wordCorrect,
              word.status === 'incorrect' && styles.wordIncorrect,
            ]}
          >
            <Pressable onPress={() => handleWordPress(word)} style={styles.wordPressable}>
              <Text style={styles.wordText}>{word.text}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 242, 255, 0.2)',
    paddingBottom: 20,
    zIndex: 100,
  },
  hudItem: {
    alignItems: 'center',
    width: 80,
  },
  hudLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Fonts.header,
  },
  hudValue: {
    fontSize: 18,
    color: '#fff',
    fontFamily: Fonts.header,
    fontWeight: 'bold',
  },
  targetBox: {
    flex: 1,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 10,
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
  },
  targetWord: {
    fontSize: 22,
    color: '#fff',
    fontFamily: Fonts.header,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 242, 255, 0.5)',
    textShadowRadius: 10,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  playArea: {
    flex: 1,
  },
  wordBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
  },
  wordPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  wordCorrect: {
    backgroundColor: 'rgba(0, 255, 136, 0.8)',
    borderColor: '#00ff88',
  },
  wordIncorrect: {
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
    borderColor: '#ff5252',
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
