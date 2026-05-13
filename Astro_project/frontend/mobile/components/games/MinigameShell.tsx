import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface MinigameShellProps {
  title: string;
  initialTime: number;
  onGameOver: (finalScore: number) => void;
  children: (props: { score: number; setScore: React.Dispatch<React.SetStateAction<number>>; timeLeft: number }) => React.ReactNode;
}

export default function MinigameShell({ title, initialTime, onGameOver, children }: MinigameShellProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    onGameOver(score);
  }, [score, onGameOver]);

  return (
    <View style={styles.container}>
      {/* Game Header */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>

        <View style={styles.titleBox}>
          <Text style={styles.gameTitle}>{title.toUpperCase()}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={[styles.statValue, timeLeft <= 10 && styles.timeLow]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {children({ score, setScore, timeLeft })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setIsActive(!isActive)}>
          <MaterialCommunityIcons 
            name={isActive ? "pause" : "play"} 
            size={32} 
            color={Colors.dark.tint} 
          />
        </TouchableOpacity>
      </View>

      {!isActive && timeLeft > 0 && (
        <BlurView intensity={20} tint="dark" style={styles.pauseOverlay}>
          <Text style={styles.pauseText}>MISIÓN PAUSADA</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={() => setIsActive(true)}>
            <Text style={styles.resumeButtonText}>REANUDAR</Text>
          </TouchableOpacity>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 20,
    fontWeight: '900',
  },
  timeLow: {
    color: Colors.dark.error,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  gameTitle: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  controls: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseText: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 30,
    letterSpacing: -1,
  },
  resumeButton: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  resumeButtonText: {
    color: '#000',
    fontFamily: Fonts.subheader,
    fontSize: 18,
    fontWeight: '900',
  },
});
