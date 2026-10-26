import React, { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { useApp } from "../AppContext";
import { APP_NAME } from "../brand";
import { Button } from "../components/Button";
import { PrivacySupportLinks } from "../components/PrivacySupportLinks";
import { PetAvatar } from "../components/PetAvatar";
import { AppText as Text, AppTextInput as TextInput } from "../display";
import { colors, spacing } from "../theme";
import type { PetType } from "../types";

const petTypes: PetType[] = ["cat", "dog", "rabbit"];

export function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [name, setName] = useState("Pip");
  const [petType, setPetType] = useState<PetType>("cat");
  const [budget, setBudget] = useState("50.00");
  const [busy, setBusy] = useState(false);

  const begin = async () => {
    if (!/^\d+(\.\d{1,2})?$/.test(budget.trim())) {
      Alert.alert("Check the budget", "Enter a positive weekly budget.");
      return;
    }
    const [whole = "0", decimal = ""] = budget.trim().split(".");
    const weeklyBudgetCents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
    try {
      setBusy(true);
      await completeOnboarding({ petName: name, petType, weeklyBudgetCents });
    } catch (error) {
      Alert.alert("Could not start", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>{APP_NAME.toUpperCase()} · FOR FIRST-TIME BUDGETERS</Text>
        <Text style={styles.title}>Your first budget shouldn’t feel like homework.</Text>
        <Text style={styles.body}>A tiny companion helps you notice where your money goes—without judging what you buy.</Text>

        <View style={styles.promiseList}>
          <View style={styles.promise}><Text style={styles.promiseIcon}>◇</Text><Text style={styles.promiseText}>Your money records stay on this device</Text></View>
          <View style={styles.promise}><Text style={styles.promiseIcon}>○</Text><Text style={styles.promiseText}>No bank connection or account required</Text></View>
          <View style={styles.promise}><Text style={styles.promiseIcon}>✦</Text><Text style={styles.promiseText}>Rewards come from honest check-ins, never spending</Text></View>
        </View>

        <Text style={styles.label}>Choose your pet</Text>
        <View style={styles.petTypes}>
          {petTypes.map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${type}`}
              accessibilityState={{ selected: petType === type }}
              onPress={() => setPetType(type)}
              style={[styles.petChoice, petType === type && styles.petChoiceSelected]}
            >
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <PetAvatar size={84} state={petType === type ? "curious" : "calm"} type={type} />
              </View>
              <Text style={styles.petLabel}>{type}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Pet name</Text>
        <TextInput maxLength={20} onChangeText={setName} style={styles.input} value={name} />

        <Text style={styles.label}>Weekly spending budget ($)</Text>
        <TextInput keyboardType="decimal-pad" onChangeText={setBudget} style={styles.input} value={budget} />

        <Text style={styles.disclaimer}>For education and habit-building only. {APP_NAME} does not provide financial advice.</Text>
        <Button disabled={busy} label="Start my 14-day beta" onPress={begin} style={styles.button} />
        <PrivacySupportLinks compact />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg, paddingBottom: spacing.xl },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900", lineHeight: 40, marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg, marginTop: spacing.sm },
  promiseList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  promise: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  promiseIcon: { fontSize: 18 },
  promiseText: { color: colors.text, flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: spacing.xs, marginTop: spacing.md },
  petTypes: { flexDirection: "row", gap: spacing.sm },
  petChoice: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flex: 1, padding: spacing.sm },
  petChoiceSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  petLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 2, textTransform: "capitalize" },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  button: { marginTop: spacing.lg },
});
