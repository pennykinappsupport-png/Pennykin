import React from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";

import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";

export function Screen({ title, subtitle, hideHeader = false, headerAction, children, ...props }: ScrollViewProps & {
  title: string;
  subtitle?: string;
  hideHeader?: boolean;
  headerAction?: React.ReactNode;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {!hideHeader ? <View style={styles.heading}>
        <View style={styles.headingRow}><Text style={styles.title}>{title}</Text>{headerAction}</View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 120 },
  heading: { gap: 4, paddingTop: spacing.sm },
  headingRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  title: { color: colors.text, flexShrink: 1, fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
