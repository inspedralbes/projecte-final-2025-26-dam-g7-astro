import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useWordConstructionLogic, WordObj } from '@/hooks/useWordConstructionLogic';
import MinigameShell from './MinigameShell';
import { Colors, Fonts } from '@/constants/theme';

interface WordConstructionProps {
  onGameOver: (score: number) => void;
  words?: WordObj[];
}

export default function WordConstruction({ onGameOver, words }: WordConstructionProps) {
  const { 
    currentWordObj, 
    scrambledLetters, 
    setScrambledLetters,
    loadNextWord, 
    checkAnswer, 
    orderedGuess,
    isRoundLocked
  } = useWordConstructionLogic(words);

  useEffect(() => {
    loadNextWord();
  }, []);

  const handleBuild = (setScore: React.Dispatch<React.SetStateAction<number>>) => {
    const isCorrect = checkAnswer(orderedGuess);
    if (isCorrect) {
      setScore(prev => prev + 100);
      setTimeout(loadNextWord, 1000);
    } else {
      setScore(prev => Math.max(0, prev - 20));
    }
  };

  return (
    <MinigameShell 
      title="Word Construction" 
      initialTime={90} 
      onGameOver={onGameOver}
    >
      {({ setScore }) => (
        <View style={styles.container}>
          <Text style={styles.hintLabel}>PISTA:</Text>
          <Text style={styles.hintText}>{currentWordObj.hint}</Text>

          <View style={styles.tilesContainer}>
            {scrambledLetters.map((tile, index) => (
              <View key={tile.id} style={styles.tile}>
                <Text style={styles.tileText}>{tile.letter}</Text>
              </View>
            ))}
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>ORDEN ACTUAL:</Text>
            <Text style={styles.previewText}>{orderedGuess}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.buildButton, isRoundLocked && styles.buildButtonDisabled]} 
            onPress={() => handleBuild(setScore)}
            disabled={isRoundLocked}
          >
            <Text style={styles.buildButtonText}>CONSTRUIR BLOQUE</Text>
          </TouchableOpacity>
        </View>
      )}
    </MinigameShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLabel: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  hintText: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  tile: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: Colors.dark.tint,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 24,
    fontWeight: '900',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },
  previewText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  buildButton: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buildButtonDisabled: {
    opacity: 0.5,
  },
  buildButtonText: {
    color: '#000',
    fontFamily: Fonts.subheader,
    fontSize: 16,
    fontWeight: '900',
  },
});
