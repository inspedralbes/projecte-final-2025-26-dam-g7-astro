import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

interface SyllableQuestProps {
  isMultiplayer?: boolean;
  onExit: (score: number) => void;
}

export const SyllableQuest: React.FC<SyllableQuestProps> = ({ isMultiplayer, onExit }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState({ text: 'PLANETA', syllables: 3 });
  const [userSyllables, setUserSyllables] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | 'success' | 'error'>(null);

  useEffect(() => {
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

  const handleClap = () => {
    if (userSyllables < 8) setUserSyllables(s => s + 1);
  };

  const handleCheck = () => {
    if (userSyllables === currentWord.syllables) {
      setScore(s => s + 100);
      setTimeLeft(t => t + 5);
      setShowFeedback('success');
      // Mock next word
      setCurrentWord({ text: 'ESTRELLA', syllables: 3 });
    } else {
      setShowFeedback('error');
    }
    setUserSyllables(0);
    setTimeout(() => setShowFeedback(null), 1000);
  };

  if (gameFinished) {
    return (
      <View style={styles.finishedCard}>
        <IconSymbol name="music.note.list" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>MISIÓN RÍTMICA COMPLETADA</Text>
        <Text style={styles.finalScore}>Puntuación: {score}</Text>
        <Pressable onPress={() => onExit(score)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>CONTINUAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.hud}>
          <Text style={styles.hudText}>PUNTOS: {score}</Text>
          <Text style={[styles.hudText, timeLeft <= 10 && styles.textRed]}>TIEMPO: {timeLeft}s</Text>
        </View>

        <Text style={styles.word}>{currentWord.text}</Text>
        <Text style={styles.instruction}>¿Cuántas sílabas tiene?</Text>

        <View style={styles.syllableDisplay}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.syllableDot, 
                i < userSyllables && styles.dotActive
              ]}
            >
              {i < userSyllables && <IconSymbol name="music.note" size={16} color="#000" />}
            </View>
          ))}
        </View>

        <Pressable style={styles.clapBtn} onPress={handleClap}>
          <IconSymbol name="hand.tap.fill" size={40} color="#000" />
          <Text style={styles.clapText}>¡PICAR!</Text>
        </Pressable>

        <Pressable style={styles.checkBtn} onPress={handleCheck}>
          <Text style={styles.checkText}>COMPROBAR</Text>
        </Pressable>
      </View>

      {showFeedback && (
        <View style={[styles.feedbackOverlay, showFeedback === 'success' ? styles.successBg : styles.errorBg]}>
          <IconSymbol 
            name={showFeedback === 'success' ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
            size={100} 
            color="#fff" 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  hudText: {
    color: '#fbbf24',
    fontFamily: Fonts.header,
    fontSize: 14,
  },
  textRed: { color: '#ff5252' },
  word: {
    fontSize: 40,
    fontFamily: Fonts.header,
    color: '#fff',
    fontWeight: '900',
    marginBottom: 10,
  },
  instruction: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 30,
  },
  syllableDisplay: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  syllableDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fff',
  },
  clapBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    elevation: 10,
  },
  clapText: {
    fontWeight: '900',
    fontSize: 12,
    marginTop: 5,
  },
  checkBtn: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
