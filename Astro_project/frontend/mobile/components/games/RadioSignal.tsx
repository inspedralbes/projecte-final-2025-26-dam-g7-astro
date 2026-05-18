import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Animated, Dimensions } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RadioSignalProps {
  isMultiplayer?: boolean;
  isRace?: boolean;
  isPaused?: boolean;
  onExit: (score: number) => void;
}

export const RadioSignal: React.FC<RadioSignalProps> = ({
  isMultiplayer = false,
  isRace = false,
  isPaused = false,
  onExit,
}) => {
  const multiplayerStore = useMultiplayerStore();
  const sessionStore = useSessionStore();

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetFreq, setTargetFreq] = useState(Math.random() * 90 + 5);
  const [currentFreq, setCurrentFreq] = useState(Math.random() * 20);
  const [isTuned, setIsTuned] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState<null | 'success' | 'error'>(null);

  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

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

  useEffect(() => {
    const dist = Math.abs(currentFreq - targetFreq);
    setIsTuned(dist < 3);
  }, [currentFreq, targetFreq]);

  const handleCheck = () => {
    // Ported simplified logic
    if (userGuess.toUpperCase().trim() === 'ASTRO') {
      setScore(s => s + 150);
      setTimeLeft(t => t + 15);
      setTargetFreq(Math.random() * 90 + 5);
      setUserGuess('');
      setShowFeedback('success');
    } else {
      setShowFeedback('error');
    }
    setTimeout(() => setShowFeedback(null), 1000);
  };

  const renderWave = (isTarget: boolean) => {
    const points = 50;
    const width = SCREEN_WIDTH - 80;
    const height = 60;
    const freq = isTarget ? 0.2 : (0.1 + (Math.abs(currentFreq - targetFreq) / 50));
    const amp = isTuned ? 20 : (isTarget ? 20 : 10 + Math.random() * 10);
    
    let path = `M 0 ${height / 2}`;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const y = height / 2 + Math.sin(i * freq) * amp;
      path += ` L ${x} ${y}`;
    }

    return (
      <Svg height={height} width={width}>
        <Path
          d={path}
          stroke={isTarget ? '#FF9800' : (isTuned ? '#00e5ff' : '#444')}
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    );
  };

  if (gameFinished) {
    return (
      <View style={styles.finishedCard}>
        <IconSymbol name="radio.fill" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>RECEPTOR SINTONITZAT</Text>
        <Text style={styles.finalScore}>Puntuació: {score}</Text>
        <Pressable onPress={() => onExit(score)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>CONTINUAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabinet}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>ASTRO RX-7</Text>
          <Text style={styles.brandSubtitle}>COMMUNICATIONS RECEIVER</Text>
        </View>

        <View style={styles.hud}>
          <Text style={styles.hudText}>SCORE: {score}</Text>
          <Text style={[styles.hudText, timeLeft <= 10 && styles.textRed]}>TIME: {timeLeft}s</Text>
        </View>

        <View style={styles.screenHousing}>
          <View style={styles.waveScreen}>
            <Text style={styles.screenLabel}>TARGET SIGNAL</Text>
            {renderWave(true)}
          </View>
          <View style={styles.waveScreen}>
            <Text style={styles.screenLabel}>CURRENT SIGNAL</Text>
            {renderWave(false)}
          </View>
        </View>

        <View style={styles.indicatorStrip}>
          <Text style={styles.freqValue}>{currentFreq.toFixed(1)} MHz</Text>
          <View style={[styles.statusDot, isTuned ? styles.dotGreen : styles.dotRed]} />
          <Text style={[styles.statusText, isTuned ? styles.textGreen : styles.textRed]}>
            {isTuned ? 'LOCKED' : 'SCANNING'}
          </Text>
        </View>

        <View style={styles.dialHousing}>
          <View style={styles.dialTrack}>
            <View style={[styles.dialIndicator, { left: `${currentFreq}%` }]} />
          </View>
          <View style={styles.sliderContainer}>
            <IconSymbol name="antenna" size={20} color="#444" />
            <View style={styles.track}>
              <Pressable 
                style={styles.touchArea}
                onStartShouldSetResponder={() => true}
                onResponderMove={(e) => {
                  const x = e.nativeEvent.locationX;
                  const newFreq = Math.min(100, Math.max(0, (x / (SCREEN_WIDTH - 120)) * 100));
                  setCurrentFreq(newFreq);
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputHousing}>
          {isTuned ? (
            <View style={styles.inputActive}>
              <Text style={styles.inputLabel}>INCOMING TRANSMISSION...</Text>
              <TextInput
                style={styles.input}
                value={userGuess}
                onChangeText={setUserGuess}
                placeholder="Type transmission..."
                placeholderTextColor="rgba(0, 229, 255, 0.3)"
                autoCapitalize="characters"
              />
              <Pressable style={styles.sendBtn} onPress={handleCheck}>
                <Text style={styles.sendBtnText}>SEND</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.inputPlaceholder}>
              <IconSymbol name="antenna.radiowaves.left.and.right" size={24} color="#444" />
              <Text style={styles.placeholderText}>WAITING FOR SIGNAL SYNC...</Text>
            </View>
          )}
        </View>
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
  cabinet: {
    width: '100%',
    backgroundColor: '#1e2028',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#3d424d',
    padding: 15,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandText: {
    fontFamily: Fonts.header,
    color: '#ccc',
    fontSize: 16,
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 8,
    color: '#555',
    letterSpacing: 2,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  hudText: {
    color: '#d3d7e0',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  screenHousing: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3a3f4b',
  },
  waveScreen: {
    height: 70,
    marginBottom: 5,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  screenLabel: {
    position: 'absolute',
    top: 2,
    left: 5,
    fontSize: 8,
    color: '#334',
    fontWeight: 'bold',
    zIndex: 1,
  },
  indicatorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171c',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  freqValue: {
    fontFamily: 'monospace',
    color: Colors.dark.tint,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotGreen: { backgroundColor: '#4caf50' },
  dotRed: { backgroundColor: '#f44336' },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  textGreen: { color: '#4caf50' },
  textRed: { color: '#f44336' },
  dialHousing: {
    backgroundColor: '#15171c',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  dialTrack: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 20,
  },
  dialIndicator: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 12,
    backgroundColor: '#f44336',
    borderRadius: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 40,
    backgroundColor: '#0a0c10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d3139',
    overflow: 'hidden',
  },
  touchArea: {
    flex: 1,
  },
  inputHousing: {
    height: 100,
    backgroundColor: '#15171c',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  inputActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputLabel: {
    position: 'absolute',
    top: -15,
    left: 0,
    fontSize: 8,
    color: Colors.dark.tint,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0c10',
    color: Colors.dark.tint,
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  sendBtn: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#444',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  successBg: { backgroundColor: 'rgba(76, 175, 80, 0.8)' },
  errorBg: { backgroundColor: 'rgba(244, 67, 54, 0.8)' },
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
