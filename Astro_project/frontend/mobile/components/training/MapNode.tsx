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
        <View style={styles.nodeInner}>
          <MaterialCommunityIcons
            name={state === 'completed' ? 'check-decagram' : state === 'current' ? 'rocket-launch' : 'lock-outline'}
            size={32}
            color={isLocked ? 'rgba(255,255,255,0.2)' : '#fff'}
          />
        </View>
        {state === 'current' && <View style={styles.pulseRing} />}
      </TouchableOpacity>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, isLocked && styles.labelLocked]}>
          {name.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 25,
    width: 140,
  },
  pos_left: { alignSelf: 'flex-start', marginLeft: 10 },
  pos_right: { alignSelf: 'flex-end', marginRight: 10 },
  pos_center: { alignSelf: 'center' },
  node: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nodeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  node_locked: {
    opacity: 0.6,
  },
  node_current: {
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  node_completed: {
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
    opacity: 0.4,
    zIndex: 1,
  },
  labelContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    color: '#fff',
    fontFamily: Fonts.subheader,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  labelLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
});
