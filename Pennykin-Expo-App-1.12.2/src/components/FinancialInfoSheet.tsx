import React from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";

export type FinancialInfoContent = {
  title: string;
  whatItMeans: string;
  formulas: string[];
  numbers: string[];
  keepInMind: string[];
  why: string;
};

const infoPalettes = {
  light: {
    backdrop: "rgba(24, 20, 39, 0.42)",
    border: "#D8CEE8",
    button: "#4D35BE",
    formulaBackground: "#E9E3FF",
    formulaBorder: "#B5A5F2",
    handle: "#B7ADB4",
    label: "#4D35BE",
    numberBackground: "#FFFFFF",
    sheet: "#FFF9F2",
    text: "#241D37",
    whyBackground: "#DDF4E9",
  },
  dark: {
    backdrop: "rgba(0, 0, 0, 0.68)",
    border: "#574D67",
    button: "#5940C8",
    formulaBackground: "#31265E",
    formulaBorder: "#7868B7",
    handle: "#82798C",
    label: "#CEC5FF",
    numberBackground: "#231E2B",
    sheet: "#17131F",
    text: "#F7F3FF",
    whyBackground: "#173B31",
  },
};

export function InfoButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityHint="Opens an explanation with the formula and your current numbers."
      accessibilityLabel={`Learn how ${label} is calculated`}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.infoTouch, pressed && styles.pressed]}
    >
      <View style={styles.infoCircle}><Text style={styles.infoText}>i</Text></View>
    </Pressable>
  );
}

function BulletList({ items, labelColor, textColor }: { items: string[]; labelColor: string; textColor: string }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.listRow}>
          <Text style={[styles.bullet, { color: labelColor }]}>•</Text>
          <Text style={[styles.listText, { color: textColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function FinancialInfoSheet({
  content,
  onClose,
  visible,
}: {
  content: FinancialInfoContent | null;
  onClose: () => void;
  visible: boolean;
}) {
  const palette = useColorScheme() === "dark" ? infoPalettes.dark : infoPalettes.light;
  if (!content) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View accessibilityViewIsModal style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close explanation" onPress={onClose} style={[styles.backdrop, { backgroundColor: palette.backdrop }]} />
        <SafeAreaView style={[styles.sheet, { backgroundColor: palette.sheet }]}>
          <View style={[styles.handle, { backgroundColor: palette.handle }]} />
          <View style={[styles.header, { borderBottomColor: palette.border }]}>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: palette.label }]}>MONEY, EXPLAINED</Text>
              <Text style={[styles.title, { color: palette.text }]}>{content.title}</Text>
            </View>
            <Pressable accessibilityLabel="Close explanation" accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.numberBackground, borderColor: palette.border }]}>
              <Text style={[styles.closeText, { color: palette.text }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.label }]}>WHAT IT MEANS</Text>
              <Text style={[styles.body, { color: palette.text }]}>{content.whatItMeans}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.label }]}>HOW IT’S CALCULATED</Text>
              <View style={styles.formulaStack}>
                {content.formulas.map((formula) => <Text key={formula} style={[styles.formula, { backgroundColor: palette.formulaBackground, borderColor: palette.formulaBorder, color: palette.text }]}>{formula}</Text>)}
              </View>
            </View>

            <View style={[styles.section, styles.numberSection, { backgroundColor: palette.numberBackground, borderColor: palette.border }]}>
              <Text style={[styles.sectionLabel, { color: palette.label }]}>YOUR NUMBERS</Text>
              <BulletList items={content.numbers} labelColor={palette.label} textColor={palette.text} />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.label }]}>KEEP IN MIND</Text>
              <BulletList items={content.keepInMind} labelColor={palette.label} textColor={palette.text} />
            </View>

            <View style={[styles.section, styles.whySection, { backgroundColor: palette.whyBackground }]}>
              <Text style={[styles.sectionLabel, { color: palette.label }]}>WHY PENNYKIN SHOWS THIS</Text>
              <Text style={[styles.body, { color: palette.text }]}>{content.why}</Text>
            </View>

            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.doneButton, { backgroundColor: palette.button }, pressed && styles.pressed]}>
              <Text style={styles.doneText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    overflow: "hidden",
  },
  handle: { alignSelf: "center", borderRadius: 99, height: 5, marginTop: 9, width: 44 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 14 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { flexShrink: 1, fontSize: 24, fontWeight: "900", marginTop: 3 },
  closeButton: { alignItems: "center", borderRadius: 99, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  closeText: { fontSize: 28, fontWeight: "500" },
  scrollContent: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  section: { gap: spacing.xs },
  sectionLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  body: { fontSize: 14 },
  formulaStack: { gap: spacing.xs },
  formula: { borderRadius: 12, borderWidth: 1, fontSize: 13, fontWeight: "800", padding: 12 },
  numberSection: { borderRadius: 16, borderWidth: 1, padding: 13 },
  whySection: { borderRadius: 16, padding: 13 },
  list: { gap: 7 },
  listRow: { flexDirection: "row", gap: 8 },
  bullet: { fontSize: 16, fontWeight: "900" },
  listText: { flex: 1, fontSize: 13 },
  doneButton: { alignItems: "center", borderRadius: 15, minHeight: 50, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "center" },
  doneText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  infoTouch: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  infoCircle: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: 99, borderWidth: 1.5, height: 23, justifyContent: "center", width: 23 },
  infoText: { color: colors.primary, fontSize: 13, fontWeight: "900", lineHeight: 16 },
  pressed: { opacity: 0.65 },
});
