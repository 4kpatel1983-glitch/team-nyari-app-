import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

// બધા સ્કેલેટોન માટે વપરાતો બેઝ કલર
const SKELETON_COLOR = '#E1DFD7';

// --------------------------------------------------------------------------
// 1. BASE SKELETON (એનિમેશનનું કામ કરે છે)
// --------------------------------------------------------------------------
export const SkeletonBase = ({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SKELETON_COLOR,
          opacity,
        },
        style,
      ]}
    />
  );
};

// --------------------------------------------------------------------------
// 2. SKELETON TEXT (લખાણની લાઈન માટે)
// --------------------------------------------------------------------------
export const SkeletonText = ({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle | ViewStyle[];
}) => {
  return <SkeletonBase width={width} height={height} borderRadius={4} style={style} />;
};

// --------------------------------------------------------------------------
// 3. SKELETON BOX (ચોરસ/લંબચોરસ બોક્સ માટે)
// --------------------------------------------------------------------------
export const SkeletonBox = ({
  width,
  height,
  borderRadius = 12,
  style,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}) => {
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

// --------------------------------------------------------------------------
// 4. SKELETON AVATAR (ગોળાકાર ફોટો માટે)
// --------------------------------------------------------------------------
export const SkeletonAvatar = ({
  size = 50,
  style,
}: {
  size?: number;
  style?: ViewStyle | ViewStyle[];
}) => {
  return (
    <SkeletonBase
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};