import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function StarsBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {stars.map((star) => (
          <Circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="white"
            fillOpacity={star.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}
