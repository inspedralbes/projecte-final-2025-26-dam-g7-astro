import React from 'react';
import { StyleSheet, ScrollView, View, Dimensions } from 'react-native';
import { useProgressStore } from '@/stores/progressStore';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SpatialMap() {
  const mapLevel = useProgressStore((state) => state.mapLevel);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.spacer} />
      {/* Level nodes and paths will be rendered here in subsequent tasks */}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
    // We'll calculate dynamic height based on levels later
    minHeight: Dimensions.get('window').height,
  },
  spacer: {
    height: 100,
  },
});
