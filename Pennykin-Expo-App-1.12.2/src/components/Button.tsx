import React from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";

import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "secondary" ? styles.secondaryLabel : styles.lightLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primaryStrong },
  secondary: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1 },
  danger: { backgroundColor: colors.redStrong },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  label: { fontSize: 15, fontWeight: "700" },
  lightLabel: { color: colors.onPrimary },
  secondaryLabel: { color: colors.primary },
});
