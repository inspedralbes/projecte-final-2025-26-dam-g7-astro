import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface LevelPreviewProps {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  levelName: string;
  gameId: string;
  minScore: number;
}

export default function LevelPreview({ visible, onClose, onStart, levelName, gameId, minScore }: LevelPreviewProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.levelTitle}>{levelName.toUpperCase()}</Text>
            <View style={styles.gameBadge}>
              <Text style={styles.gameBadgeText}>{gameId.replace(/-/g, ' ').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="target" size={24} color={Colors.dark.tint} />
            <Text style={styles.infoText}>Objetivo: {minScore} puntos</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>INICIAR MISIÓN</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  levelTitle: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameBadge: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
  },
  gameBadgeText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10,
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  startButton: {
    backgroundColor: Colors.dark.tint,
    width: '100%',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#000',
    fontFamily: Fonts.subheader,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
