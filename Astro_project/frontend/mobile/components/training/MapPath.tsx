import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface MapPathProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
}

export default function MapPath({ startX, startY, endX, endY, isActive }: MapPathProps) {
  // Simple cubic bezier curve for the path
  const midY = (startY + endY) / 2;
  const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Path
          d={d}
          stroke={isActive ? '#00f2ff' : 'rgba(255,255,255,0.1)'}
          strokeWidth="4"
          fill="none"
          strokeDasharray="8 8"
        />
      </Svg>
    </View>
  );
}
