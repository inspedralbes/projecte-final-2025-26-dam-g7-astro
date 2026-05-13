import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface PhaseDividerProps {
  title: string;
  subtitle: string;
  icon: string;
  align: 'left' | 'right';
}

export default function PhaseDivider({ title, subtitle, icon, align }: PhaseDividerProps) {
  const isRight = align === 'right';

  return (
    <View style={[styles.container, isRight && styles.containerRight]}>
      <View style={[styles.textBlock, isRight && styles.textBlockRight]}>
        <Text style={styles.subtitle}>{subtitle.toUpperCase()}</Text>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
      </View>
      
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <View style={styles.node} />
        <View style={styles.line} />
      </View>

      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={60} 
          color="rgba(0, 242, 255, 0.2)" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 30,
    marginVertical: 20,
    position: 'relative',
  },
  containerRight: {
    alignItems: 'flex-end',
  },
  textBlock: {
    marginBottom: 10,
  },
  textBlockRight: {
    alignItems: 'flex-end',
  },
  subtitle: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    opacity: 0.4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.tint,
  },
  node: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
    marginHorizontal: 10,
  },
  iconWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 10,
    zIndex: -1,
  },
});
