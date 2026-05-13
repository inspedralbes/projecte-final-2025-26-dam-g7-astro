import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export type NodeState = 'locked' | 'current' | 'completed';

interface MapNodeProps {
  id: string;
  name: string;
  state: NodeState;
  onPress: () => void;
  position: 'left' | 'right' | 'center';
}

export default function MapNode({ name, state, onPress, position }: MapNodeProps) {
  const isLocked = state === 'locked';
  
  const getPositionStyle = () => {
    switch(position) {
      case 'left': return styles.pos_left;
      case 'right': return styles.pos_right;
      default: return styles.pos_center;
    }
  };

  const getNodeStyle = () => {
    switch(state) {
      case 'current': return styles.node_current;
      case 'completed': return styles.node_completed;
      default: return styles.node_locked;
    }
  };

  return (
    <View style={[styles.wrapper, getPositionStyle()]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        style={[styles.node, getNodeStyle()]}
      >
        <MaterialCommunityIcons
          name={state === 'completed' ? 'check-bold' : state === 'current' ? 'rocket-launch' : 'lock'}
          size={32}
          color={isLocked ? 'rgba(255,255,255,0.3)' : '#fff'}
        />
      </TouchableOpacity>
      <Text style={[styles.label, isLocked && styles.labelLocked]}>
        {name.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 20,
    width: 150,
  },
  pos_left: { alignSelf: 'flex-start' },
  pos_right: { alignSelf: 'flex-end' },
  pos_center: { alignSelf: 'center' },
  node: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 10,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  node_locked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
  },
  node_current: {
    backgroundColor: Colors.dark.tint,
    borderColor: '#fff',
    shadowOpacity: 0.8,
  },
  node_completed: {
    backgroundColor: '#00c853',
    borderColor: '#fff',
    shadowColor: '#00c853',
  },
  label: {
    color: '#fff',
    marginTop: 8,
    fontFamily: Fonts.subheader,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelLocked: {
    opacity: 0.4,
  },
});
