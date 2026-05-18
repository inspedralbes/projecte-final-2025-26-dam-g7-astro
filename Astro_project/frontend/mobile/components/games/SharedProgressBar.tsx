import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';

interface SharedProgressBarProps {
  sequence: string[];
  localProgress: number;
  partnerProgress: number;
  localAvatar?: string;
  partnerAvatar?: string;
  localName?: string;
  partnerName?: string;
}

export const SharedProgressBar: React.FC<SharedProgressBarProps> = ({
  sequence,
  localProgress,
  partnerProgress,
  localAvatar,
  partnerAvatar,
  localName,
  partnerName,
}) => {
  const animatedLocal = useRef(new Animated.Value(localProgress)).current;
  const animatedPartner = useRef(new Animated.Value(partnerProgress)).current;

  useEffect(() => {
    Animated.timing(animatedLocal, {
      toValue: localProgress,
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [localProgress]);

  useEffect(() => {
    Animated.timing(animatedPartner, {
      toValue: partnerProgress,
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [partnerProgress]);

  const getPosition = (progress: Animated.Value) => {
    return progress.interpolate({
      inputRange: [0, Math.max(1, sequence.length - 1)],
      outputRange: ['0%', '100%'],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={styles.trackLine} />
        <Animated.View style={[styles.trackLineFill, { width: getPosition(animatedLocal) }]} />

        {sequence.map((game, index) => (
          <View 
            key={index} 
            style={[styles.milestone, { left: `${(index / (sequence.length - 1)) * 100}%` }]}
          >
            <View style={[styles.milestoneDot, index <= localProgress && styles.completedDot]} />
            <Text style={styles.milestoneLabel}>{game.substring(0, 4)}</Text>
          </View>
        ))}

        <Animated.View style={[styles.playerIcon, { left: getPosition(animatedLocal) }]}>
          <View style={styles.localAvatarContainer}>
            {localAvatar && <Image source={{ uri: localAvatar }} style={styles.avatar} />}
          </View>
          <Text style={styles.playerLabel}>{localName}</Text>
        </Animated.View>

        <Animated.View style={[styles.playerIcon, styles.partnerPlayerIcon, { left: getPosition(animatedPartner) }]}>
          <View style={styles.partnerAvatarContainer}>
            {partnerAvatar && <Image source={{ uri: partnerAvatar }} style={styles.avatar} />}
          </View>
          <Text style={[styles.playerLabel, styles.partnerLabel]}>{partnerName}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 20,
  },
  track: {
    height: 4,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackLineFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: '#00e5ff',
  },
  milestone: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    marginLeft: -20,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  completedDot: {
    backgroundColor: '#00e5ff',
    transform: [{ scale: 1.2 }],
  },
  milestoneLabel: {
    marginTop: 10,
    fontSize: 8,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    letterSpacing: 1,
  },
  playerIcon: {
    position: 'absolute',
    top: -15,
    alignItems: 'center',
    width: 40,
    marginLeft: -20,
  },
  partnerPlayerIcon: {
    top: 25,
  },
  localAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  partnerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff5252',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  playerLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginTop: 2,
  },
  partnerLabel: {
    color: '#ff5252',
  },
});
