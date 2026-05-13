import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { useAchievementsStore } from '@/stores/achievementsStore';
import { Colors, Fonts } from '@/constants/theme';
import { ACHIEVEMENTS } from '@/constants/achievements';

export default function AchievementsScreen() {
  const { 
    unlockedAchievements, 
    selectedAchievements, 
    updateAchievements 
  } = useAchievementsStore();

  const achievementsList = useMemo(() => {
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      isUnlocked: unlockedAchievements.includes(ach.id),
      isSelected: selectedAchievements.includes(ach.id),
    }));
  }, [unlockedAchievements, selectedAchievements]);

  const handleSelect = async (id: number) => {
    if (!unlockedAchievements.includes(id)) return;

    let newSelection = [...selectedAchievements];
    if (newSelection.includes(id)) {
      // Deselect
      newSelection = newSelection.map(item => item === id ? null : item);
    } else {
      // Select in first empty slot or replace last
      const emptySlot = newSelection.indexOf(null);
      if (emptySlot !== -1) {
        newSelection[emptySlot] = id;
      } else {
        newSelection.shift();
        newSelection.push(id);
      }
    }

    const result = await updateAchievements(newSelection);
    if (!result.success) {
      Alert.alert('Error', result.message || 'No se pudo actualizar la selección');
    }
  };

  const getTierColor = (type: string) => {
    switch (type) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return Colors.dark.tint;
    }
  };

  return (
    <AstroLayout>
      <View style={styles.header}>
        <Text style={styles.title}>LOGROS Y TROFEOS</Text>
        <Text style={styles.subtitle}>
          Has desbloqueado {unlockedAchievements.length} de {ACHIEVEMENTS.length}
        </Text>
      </View>

      <View style={styles.showcaseSection}>
        <Text style={styles.sectionTitle}>VITRINA DE PERFIL</Text>
        <View style={styles.showcaseRow}>
          {[0, 1, 2].map(slot => {
            const achId = selectedAchievements[slot];
            const achievement = ACHIEVEMENTS.find(a => a.id === achId);
            
            return (
              <View key={slot} style={styles.showcaseSlot}>
                {achievement ? (
                  <View style={styles.showcaseItem}>
                    <MaterialCommunityIcons 
                      name={achievement.icon as any} 
                      size={32} 
                      color={getTierColor(achievement.type)} 
                    />
                  </View>
                ) : (
                  <View style={styles.emptySlot}>
                    <MaterialCommunityIcons name="trophy-outline" size={24} color="rgba(255,255,255,0.05)" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.showcaseHint}>Toca un logro desbloqueado para mostrarlo en tu perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {achievementsList.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.card, 
                item.isUnlocked && styles.cardUnlocked,
                item.isSelected && styles.cardSelected
              ]}
              onPress={() => handleSelect(item.id)}
              disabled={!item.isUnlocked}
            >
              <View style={[
                styles.iconBox, 
                { backgroundColor: item.isUnlocked ? `${getTierColor(item.type)}20` : 'rgba(255,255,255,0.02)' }
              ]}>
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={30} 
                  color={item.isUnlocked ? getTierColor(item.type) : 'rgba(255,255,255,0.1)'} 
                />
                {item.isSelected && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check" size={10} color="#000" />
                  </View>
                )}
              </View>
              <Text style={[styles.itemName, !item.isUnlocked && styles.textLocked]}>{item.title}</Text>
              <Text style={[styles.itemDesc, !item.isUnlocked && styles.textLocked]}>{item.description}</Text>
              
              {!item.isUnlocked && (
                <View style={styles.lockOverlay}>
                  <MaterialCommunityIcons name="lock" size={12} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.lockText}>BLOQUEADO</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.8,
  },
  showcaseSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },
  showcaseRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  showcaseSlot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  showcaseItem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    opacity: 0.5,
  },
  showcaseHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    opacity: 0.8,
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 1,
  },
  cardSelected: {
    borderColor: Colors.dark.tint,
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.dark.tint,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#05050a',
  },
  itemName: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.body,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  textLocked: {
    opacity: 0.3,
  },
  lockOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    opacity: 0.5,
  },
  lockText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
