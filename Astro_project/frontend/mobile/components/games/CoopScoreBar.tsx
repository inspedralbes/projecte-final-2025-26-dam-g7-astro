import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

interface CoopScoreBarProps {
  score: number;
  maxScore?: number;
  teamName?: string;
  theme?: 'cyan' | 'green' | 'red' | 'amber' | 'purple';
  compact?: boolean;
  time?: number | null;
}

const THEMES = {
  cyan: { color: '#00e5ff', glow: 'rgba(0, 229, 255, 0.5)', gradient: ['#00e5ff', '#7c4dff'] },
  green: { color: '#00ff88', glow: 'rgba(0, 255, 136, 0.5)', gradient: ['#00ff88', '#00c853'] },
  red: { color: '#ff5252', glow: 'rgba(255, 82, 82, 0.5)', gradient: ['#ff5252', '#d50000'] },
  amber: { color: '#ffab40', glow: 'rgba(255, 171, 64, 0.5)', gradient: ['#ffab40', '#ff6d00'] },
  purple: { color: '#e040fb', glow: 'rgba(224, 64, 251, 0.5)', gradient: ['#e040fb', '#aa00ff'] },
};

export const CoopScoreBar: React.FC<CoopScoreBarProps> = ({
  score,
  maxScore = 5000,
  teamName = '',
  theme = 'cyan',
  compact = false,
  time = null,
}) => {
  const currentTheme = THEMES[theme];
  const animatedScore = useRef(new Animated.Value(score)).current;
  const animatedWidth = useRef(new Animated.Value((score / maxScore) * 100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedScore, { toValue: score, duration: 800, useNativeDriver: false }),
      Animated.timing(animatedWidth, { toValue: (score / maxScore) * 100, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [score, maxScore]);

  const fillPercentage = (score / maxScore) * 100;
  const activeStars = useMemo(() => {
    if (fillPercentage >= 100) return 5;
    if (fillPercentage >= 80) return 4;
    if (fillPercentage >= 60) return 3;
    if (fillPercentage >= 40) return 2;
    if (fillPercentage >= 20) return 1;
    return 0;
  }, [fillPercentage]);

  const ratingLabel = useMemo(() => {
    if (fillPercentage >= 100) return 'GALACTIC LEGEND';
    if (fillPercentage >= 80) return 'SUPERSTAR';
    if (fillPercentage >= 60) return 'GREAT';
    if (fillPercentage >= 40) return 'GOOD';
    if (fillPercentage >= 20) return 'OK';
    return 'COOP';
  }, [fillPercentage]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      {teamName !== '' && (
        <View style={[styles.teamLabelContainer, { borderLeftColor: currentTheme.color }]}>
          <Text style={styles.teamLabel}>{teamName}</Text>
        </View>
      )}

      <View style={styles.mainContainer}>
        <View style={styles.starsTrack}>
          {[1, 2, 3, 4, 5].map((n) => (
            <IconSymbol
              key={n}
              name={n <= activeStars ? 'star.fill' : 'star'}
              size={compact ? 16 : 24}
              color={n <= activeStars ? currentTheme.color : 'rgba(255,255,255,0.1)'}
            />
          ))}
        </View>

        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: widthStyle, backgroundColor: currentTheme.color }
            ]}
          >
            <View style={styles.fillGlow} />
          </Animated.View>
          
          <View style={[styles.milestone, { left: '20%' }]} />
          <View style={[styles.milestone, { left: '40%' }]} />
          <View style={[styles.milestone, { left: '60%' }]} />
          <View style={[styles.milestone, { left: '80%' }]} />
        </View>

        <View style={styles.scoreInfo}>
          {!compact && <Text style={styles.ratingLabel}>{ratingLabel}</Text>}
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{Math.round(score).toLocaleString()}</Text>
            {time !== null && (
              <View style={[styles.timerPill, time <= 10 && styles.timerCritical]}>
                <IconSymbol name="timer" size={12} color={time <= 10 ? '#ff5252' : '#fff'} />
                <Text style={[styles.timerText, time <= 10 && styles.timerCriticalText]}>
                  {Math.ceil(time)}s
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    padding: 10,
  },
  compactWrapper: {
    padding: 4,
  },
  teamLabelContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  mainContainer: {
    alignItems: 'center',
  },
  starsTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  fillGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scoreInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'monospace',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginLeft: 10,
  },
  timerCritical: {
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    borderColor: 'rgba(255, 82, 82, 0.5)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  timerCriticalText: {
    color: '#ff5252',
  },
});
