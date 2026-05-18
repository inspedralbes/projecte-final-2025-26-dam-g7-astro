import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, ImageBackground } from 'react-native';
import i18n from '@/i18n';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { Svg, Defs, RadialGradient, Stop, Rect, Mask, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RadarScanProps {
  isMultiplayer?: boolean;
  isRace?: boolean;
  isPaused?: boolean;
  onExit: (score: number) => void;
}

export const RadarScan: React.FC<RadarScanProps> = ({
  isMultiplayer = false,
  isRace = false,
  isPaused = false,
  onExit,
}) => {
  const multiplayerStore = useMultiplayerStore();
  const sessionStore = useSessionStore();

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [board, setBoard] = useState<string[]>([]);
  const [targetIndices, setTargetIndices] = useState<number[]>([]);
  const [clickedIndices, setClickedIndices] = useState<Record<number, 'correct' | 'incorrect'>>({});
  const [gameFinished, setGameFinished] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });

  const gridCount = useMemo(() => Math.min(4 + Math.floor(currentLevel / 2), 8), [currentLevel]);
  const cellSize = (SCREEN_WIDTH - 40) / gridCount;

  useEffect(() => {
    generateBoard();
  }, [currentLevel]);

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

  const generateBoard = () => {
    const totalCells = gridCount * gridCount;
    const newBoard = Array.from({ length: totalCells }, () => 'X'); // Distractor
    const t1 = Math.floor(Math.random() * totalCells);
    let t2 = Math.floor(Math.random() * totalCells);
    while (t2 === t1) t2 = Math.floor(Math.random() * totalCells);

    newBoard[t1] = 'O'; // Target
    newBoard[t2] = 'O';
    setBoard(newBoard);
    setTargetIndices([t1, t2]);
    setClickedIndices({});
  };

  const handleCellPress = (index: number) => {
    if (gameFinished || clickedIndices[index]) return;

    const isCorrect = targetIndices.includes(index);
    if (isCorrect) {
      setClickedIndices(prev => ({ ...prev, [index]: 'correct' }));
      const correctlyClickedCount = Object.values({ ...clickedIndices, [index]: 'correct' }).filter(v => v === 'correct').length;
      
      if (correctlyClickedCount >= targetIndices.length) {
        setScore(s => s + (currentLevel * 10));
        setTimeLeft(t => Math.min(60, t + 5));
        setTimeout(() => setCurrentLevel(l => l + 1), 500);
      }
    } else {
      setClickedIndices(prev => ({ ...prev, [index]: 'incorrect' }));
      setTimeLeft(t => Math.max(0, t - 5));
      setTimeout(() => {
        setClickedIndices(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }, 500);
    }
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setTouchPos({ x: locationX, y: locationY });
  };

  if (gameFinished) {
    return (
      <View style={styles.finishedContainer}>
        <IconSymbol name="bolt.circle.fill" size={80} color={Colors.dark.tint} />
        <Text style={styles.finishedTitle}>RADAR COMPLETAT</Text>
        <Text style={styles.finalScore}>Puntuació Final: {score}</Text>
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
      onResponderMove={handleTouchMove}
    >
      <View style={styles.hud}>
        <View style={styles.hudPill}>
          <Text style={styles.hudText}>PUNTS: {score}</Text>
          <Text style={[styles.hudText, timeLeft <= 10 && styles.textRed]}>TEMPS: {timeLeft}s</Text>
        </View>
      </View>

      <View style={[styles.board, { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40 }]}>
        {board.map((char, i) => (
          <Pressable
            key={i}
            style={[
              styles.cell,
              { width: cellSize, height: cellSize },
              clickedIndices[i] === 'correct' && styles.cellCorrect,
              clickedIndices[i] === 'incorrect' && styles.cellIncorrect,
            ]}
            onPress={() => handleCellPress(i)}
          >
            <Text style={styles.cellText}>{char}</Text>
          </Pressable>
        ))}
      </View>

      {/* Lighting Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <Mask id="mask">
              <Rect height="100%" width="100%" fill="white" />
              <Circle cx={touchPos.x} cy={touchPos.y} r="80" fill="black" />
            </Mask>
          </Defs>
          <Rect 
            height="100%" 
            width="100%" 
            fill="rgba(0,0,0,0.9)" 
            mask="url(#mask)" 
          />
          <Circle 
            cx={touchPos.x} 
            cy={touchPos.y} 
            r="80" 
            stroke={Colors.dark.tint} 
            strokeWidth="2" 
            strokeDasharray="5,5"
            fill="transparent"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hud: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  hudPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    gap: 30,
  },
  hudText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 14,
  },
  textRed: {
    color: '#ff5252',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cellText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cellCorrect: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
  },
  cellIncorrect: {
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
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
  },
  lighting: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
  }
});
