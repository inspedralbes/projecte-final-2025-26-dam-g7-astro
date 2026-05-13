import React, { useState } from 'react';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import AstroLayout from '@/components/layout/AstroLayout';
import MapNode, { NodeState } from '@/components/training/MapNode';
import MapPath from '@/components/training/MapPath';
import PhaseDivider from '@/components/training/PhaseDivider';
import LevelPreview from '@/components/training/LevelPreview';
import WordConstruction from '@/components/games/WordConstruction';
import { useProgressStore } from '@/stores/progressStore';

export default function TrainingScreen() {
  const { mapLevel, registerCompletedGame, fetchUserStats } = useProgressStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [previewLevel, setPreviewLevel] = useState<any | null>(null);

  const levelSequence = [
    { id: 'word-construction', name: 'Preparativos', minScore: 100, phase: { title: 'Fase 1: Tierra', subtitle: 'Despegue', icon: 'earth', align: 'left' } },
    { id: 'radar-scan', name: 'Despegue', minScore: 200 },
    { id: 'radio-signal', name: 'Gravedad', minScore: 350 },
    { id: 'spelled-rosco', name: 'Desacoplamiento', minScore: 500 },
    { id: 'rhyme-squad', name: 'Ruta', minScore: 750, phase: { title: 'Fase 2: Sistema Solar', subtitle: 'Navegación', icon: 'solar-system', align: 'right' } },
  ];

  const getLevelState = (index: number): NodeState => {
    const levelNum = index + 1;
    if (levelNum === mapLevel) return 'current';
    if (levelNum < mapLevel) return 'completed';
    return 'locked';
  };

  const handleNodePress = (level: any) => {
    setPreviewLevel(level);
  };

  const handleGameOver = async (score: number) => {
    const levelIndex = levelSequence.findIndex(l => l.id === activeGame);
    const levelConfig = levelSequence[levelIndex];

    if (score < levelConfig.minScore) {
      Alert.alert('Misión Fallida', `Necesitas ${levelConfig.minScore} puntos. Obtuviste ${score}.`);
    } else {
      const nodeToComplete = (levelIndex + 1 === mapLevel) ? mapLevel : null;
      await registerCompletedGame(activeGame!, score, nodeToComplete);
      await fetchUserStats();
      Alert.alert('Misión Completada', `¡Buen trabajo! Puntuación final: ${score}`);
    }
    setActiveGame(null);
  };

  if (activeGame === 'word-construction') {
    return <WordConstruction onGameOver={handleGameOver} />;
  }

  return (
    <AstroLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          {levelSequence.map((level, index) => (
            <React.Fragment key={index}>
              {level.phase && (
                <PhaseDivider 
                  title={level.phase.title} 
                  subtitle={level.phase.subtitle} 
                  icon={level.phase.icon} 
                  align={level.phase.align as any} 
                />
              )}
              
              <MapNode
                id={level.id}
                name={level.name}
                state={getLevelState(index)}
                position={index % 2 === 0 ? 'left' : 'right'}
                onPress={() => handleNodePress(level)}
              />

              {index < levelSequence.length - 1 && (
                <MapPath 
                  startX={index % 2 === 0 ? 80 : 280} 
                  startY={index * 150 + 100} 
                  endX={(index + 1) % 2 === 0 ? 80 : 280} 
                  endY={(index + 1) * 150 + 100}
                  isActive={index + 1 < mapLevel}
                />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {previewLevel && (
        <LevelPreview
          visible={!!previewLevel}
          levelName={previewLevel.name}
          gameId={previewLevel.id}
          minScore={previewLevel.minScore}
          onClose={() => setPreviewLevel(null)}
          onStart={() => {
            setActiveGame(previewLevel.id);
            setPreviewLevel(null);
          }}
        />
      )}
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
  },
  mapContainer: {
    paddingTop: 60,
    position: 'relative',
  },
});
