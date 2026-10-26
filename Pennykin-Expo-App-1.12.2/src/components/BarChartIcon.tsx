import React from "react";
import { type ColorValue, StyleSheet, View } from "react-native";

export function BarChartIcon({ color, size = 20 }: { color: ColorValue; size?: number }) {
  const barWidth = Math.max(3, Math.round(size * 0.18));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { gap: Math.max(2, Math.round(size * 0.1)), height: size, width: size }]}>
      {[0.42, 0.7, 1].map((ratio) => <View key={ratio} style={{ backgroundColor: color, borderRadius: barWidth / 2, height: Math.round(size * ratio), width: barWidth }} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: "flex-end", flexDirection: "row", justifyContent: "center" },
});
