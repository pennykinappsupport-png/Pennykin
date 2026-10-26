import React from "react";
import { StyleSheet, View, type ColorValue } from "react-native";

import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";

export function StatBar({ label, value, color }: { label: string; value: number; color: ColorValue }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{safeValue}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safeValue}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.text, fontSize: 13, fontWeight: "600" },
  value: { color: colors.muted, fontSize: 12 },
  track: { backgroundColor: colors.track, borderRadius: 99, height: 8, overflow: "hidden" },
  fill: { borderRadius: 99, height: "100%" },
});
