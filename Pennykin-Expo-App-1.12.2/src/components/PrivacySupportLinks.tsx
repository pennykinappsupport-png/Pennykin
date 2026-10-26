import React, { useState } from "react";
import { Alert, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { APP_VERSION } from "../brand";
import { AppText as Text } from "../display";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL } from "../support";
import content from "../supportContent.json";
import { colors, spacing } from "../theme";
import { Button } from "./Button";

type Page = "privacy" | "support";

export function PrivacySupportLinks({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState<Page | null>(null);
  const openWeb = async (url: string) => {
    try { await Linking.openURL(url); }
    catch { Alert.alert("Could not open website", "Read the information here offline, or reconnect and try the online page again."); }
  };
  const emailSupport = async () => {
    const subject = encodeURIComponent(`Pennykin ${APP_VERSION} support`);
    try { await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`); }
    catch { Alert.alert("Could not open email", `Use Copy support email, or press and hold the address to copy it: ${SUPPORT_EMAIL}`); }
  };
  const copyEmail = async () => {
    try { await Clipboard.setStringAsync(SUPPORT_EMAIL); Alert.alert("Email copied", SUPPORT_EMAIL); }
    catch { Alert.alert("Could not copy", `Press and hold the address shown here to copy it: ${SUPPORT_EMAIL}`); }
  };
  return (
    <View style={styles.stack}>
      <View style={[styles.links, compact && styles.compact]}>
        <Pressable accessibilityRole="button" accessibilityHint="Read the complete policy without an internet connection" onPress={() => setPage("privacy")} style={styles.linkTarget}><Text style={styles.link}>Privacy Policy</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityHint="Read help and find the support email" onPress={() => setPage("support")} style={styles.linkTarget}><Text style={styles.link}>Help & Support</Text></Pressable>
      </View>
      {!compact ? <>
        <Text selectable accessibilityLabel={`Support email: ${SUPPORT_EMAIL}`} style={styles.email}>{SUPPORT_EMAIL}</Text>
        <Button label="Contact Support" onPress={() => { void emailSupport(); }} variant="secondary" />
        <Button label="Copy support email" onPress={() => { void copyEmail(); }} variant="secondary" />
      </> : null}
      <Modal visible={page !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPage(null)}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>{page === "privacy" ? "Privacy Policy" : "Help & Support"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close privacy and support" onPress={() => setPage(null)} style={styles.linkTarget}><Text style={styles.link}>Done</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.helper}>Available to read offline.</Text>
            {(page ? content[page] : []).map((section, index) => <View key={`${page}-${index}`} style={styles.section}>
              {section.title ? <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text> : null}
              {section.paragraphs.map((paragraph, i) => <Text selectable key={i} style={styles.body}>{paragraph}</Text>)}
            </View>)}
            <Button label={page === "privacy" ? "Open online privacy policy" : "Open support website"} onPress={() => { void openWeb(page === "privacy" ? PRIVACY_POLICY_URL : SUPPORT_URL); }} variant="secondary" />
            <Text selectable style={styles.email}>{SUPPORT_EMAIL}</Text>
            <Button label="Contact Support" onPress={() => { void emailSupport(); }} />
            <Button label="Copy support email" onPress={() => { void copyEmail(); }} variant="secondary" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  compact: { justifyContent: "center", marginTop: spacing.sm },
  linkTarget: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4, paddingVertical: 8 },
  link: { color: colors.primary, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  email: { color: colors.text, fontSize: 13, lineHeight: 20 },
  safe: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, flex: 1, fontSize: 20, fontWeight: "800" },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  helper: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", lineHeight: 25 },
  body: { color: colors.text, fontSize: 14, lineHeight: 22 },
});
