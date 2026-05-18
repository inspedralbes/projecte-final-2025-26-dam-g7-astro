import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
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
        <Defs>
          <LinearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#00f2ff" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>
        
        {/* Glow effect */}
        {isActive && (
          <Path
            d={d}
            stroke="#00f2ff"
            strokeWidth="8"
            fill="none"
            strokeOpacity="0.1"
            strokeLinecap="round"
          />
        )}

        <Path
          d={d}
          stroke={isActive ? "url(#pathGradient)" : 'rgba(255,255,255,0.05)'}
          strokeWidth="3"
          fill="none"
          strokeDasharray={isActive ? "0" : "6 6"}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
