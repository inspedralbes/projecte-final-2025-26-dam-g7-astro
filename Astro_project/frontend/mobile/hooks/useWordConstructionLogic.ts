import { useState, useCallback, useMemo } from 'react';

export interface WordObj {
  word: string;
  hint: string;
}

export interface LetterTile {
  id: number;
  letter: string;
}

const DEFAULT_WORDS: WordObj[] = [
  { word: 'ASTRO', hint: 'Nombre del sistema base' },
  { word: 'COSMOS', hint: 'El universo en su totalidad' },
  { word: 'ORBITA', hint: 'Trayectoria de un objeto' },
  { word: 'COHETE', hint: 'Vehículo de transporte espacial' },
  { word: 'GALAXIA', hint: 'Sistema masivo de estrellas' },
];

export function useWordConstructionLogic(words: WordObj[] = DEFAULT_WORDS) {
  const [currentWordObj, setCurrentWordObj] = useState<WordObj>(words[0]);
  const [scrambledLetters, setScrambledLetters] = useState<LetterTile[]>([]);
  const [isRoundLocked, setIsRoundLocked] = useState(false);
  const [step, setStep] = useState(0);

  const shuffleArray = (arr: any[]) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadNextWord = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * words.length);
    const nextWord = words[randomIndex];
    setCurrentWordObj(nextWord);
    
    let tiles = nextWord.word.split('').map((letter, index) => ({ id: index, letter }));
    let shuffled = shuffleArray(tiles);
    
    // Ensure it's actually scrambled
    while (shuffled.map(t => t.letter).join('') === nextWord.word && nextWord.word.length > 1) {
      shuffled = shuffleArray(tiles);
    }
    
    setScrambledLetters(shuffled);
    setIsRoundLocked(false);
  }, [words]);

  const checkAnswer = useCallback((currentOrder: string) => {
    if (isRoundLocked) return false;
    
    const isCorrect = currentOrder.toUpperCase() === currentWordObj.word.toUpperCase();
    if (isCorrect) {
      setIsRoundLocked(true);
      setStep(prev => prev + 1);
    }
    return isCorrect;
  }, [currentWordObj, isRoundLocked]);

  const orderedGuess = useMemo(() => 
    scrambledLetters.map(t => t.letter).join('')
  , [scrambledLetters]);

  return {
    currentWordObj,
    scrambledLetters,
    setScrambledLetters,
    isRoundLocked,
    step,
    loadNextWord,
    checkAnswer,
    orderedGuess
  };
}
