import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Appearance, Pressable, SafeAreaView, StyleSheet, useColorScheme, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";

import { AppProvider, useApp } from "./src/AppContext";
import { preloadAllArtwork, preloadRoomArtwork } from "./src/artworkLoader";
import { APP_NAME } from "./src/brand";
import { BarChartIcon } from "./src/components/BarChartIcon";
import { migrateDbIfNeeded } from "./src/database";
import { calendarContextKey } from "./src/date";
import { AppText as Text, DisplayProvider } from "./src/display";
import { colors } from "./src/theme";
import type { TabName } from "./src/types";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";

const tabs: Array<{ id: TabName; emoji?: string; label: string }> = [
  { id: "home", emoji: "⌂", label: "Home" },
  { id: "transactions", emoji: "+", label: "Check-in" },
  { id: "shop", emoji: "🛍", label: "Shop" },
  { id: "insights", label: "Insights" },
];

function AppContent() {
  const { snapshot, loading, refresh } = useApp();
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [artworkReady, setArtworkReady] = useState(false);
  const [artworkAttempt, setArtworkAttempt] = useState(0);
  const currentDate = useRef(calendarContextKey());
  const calendarRefreshPending = useRef(false);

  useEffect(() => {
    let active = true;
    setArtworkReady(false);
    const safetyTimer = setTimeout(() => active && setArtworkReady(true), 6500);
    preloadRoomArtwork()
      .catch(() => ({ failed: 1, total: 1 }))
      .finally(() => {
        if (!active) return;
        clearTimeout(safetyTimer);
        setArtworkReady(true);
        preloadAllArtwork().catch(() => undefined);
      });
    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [artworkAttempt]);

  useEffect(() => {
    const refreshIfDateChanged = () => {
      const nextDate = calendarContextKey();
      if (nextDate !== currentDate.current && !calendarRefreshPending.current) {
        calendarRefreshPending.current = true;
        refresh()
          .then(() => { currentDate.current = nextDate; })
          .catch(console.error)
          .finally(() => { calendarRefreshPending.current = false; });
      }
    };
    const interval = setInterval(refreshIfDateChanged, 60_000);
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 150);
    const midnightTimer = setTimeout(refreshIfDateChanged, nextMidnight.getTime() - now.getTime());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshIfDateChanged();
        preloadRoomArtwork().catch(() => undefined);
      }
    });
    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
      subscription.remove();
    };
  }, [refresh]);

  if (loading || !artworkReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>{loading ? "Waking up your pet…" : "Preparing your room artwork…"}</Text>
        {!loading && !artworkReady ? <Pressable onPress={() => setArtworkAttempt((value) => value + 1)}><Text style={styles.retryText}>Taking too long? Tap to retry</Text></Pressable> : null}
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>{APP_NAME} could not load.</Text>
        <Text style={styles.loadingText}>Close and reopen the app to try again.</Text>
      </View>
    );
  }

  if (!snapshot.settings.onboardingComplete) return <OnboardingScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.main}>
        {activeTab === "home" ? <HomeScreen navigate={setActiveTab} /> : null}
        {activeTab === "transactions" ? <TransactionsScreen navigate={setActiveTab} /> : null}
        {activeTab === "shop" ? <ShopScreen /> : null}
        {activeTab === "insights" ? <InsightsScreen /> : null}
      </View>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const isCheckin = tab.id === "transactions";
          return (
            <Pressable
              accessibilityLabel={isCheckin ? "Open quick money check-in" : tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.navItem, isCheckin && styles.checkinNavItem]}
            >
              <View style={[styles.navIcon, active && styles.navIconActive, isCheckin && styles.checkinFab, isCheckin && active && styles.checkinFabActive]}>
                {tab.id === "insights" ? <BarChartIcon color={active ? colors.primary : colors.muted} size={20} /> : <Text style={[styles.navEmoji, active && styles.navTextActive, isCheckin && styles.checkinFabText]}>{tab.emoji}</Text>}
              </View>
              <Text style={[styles.navLabel, active && styles.navTextActive, isCheckin && styles.checkinLabel]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function DisplayBridge({ children }: { children: React.ReactNode }) {
  const { snapshot } = useApp();
  const themeMode = snapshot?.settings.themeMode ?? "system";

  useEffect(() => {
    Appearance.setColorScheme(themeMode === "system" ? "unspecified" : themeMode);
  }, [themeMode]);

  return <DisplayProvider largeText={snapshot?.settings.largeText ?? false}>{children}</DisplayProvider>;
}

export default function App() {
  return (
    <SQLiteProvider databaseName="pennykin.db" onInit={migrateDbIfNeeded}>
      <AppProvider>
        <DisplayBridge><AppContent /></DisplayBridge>
      </AppProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  main: { flex: 1 },
  loading: { alignItems: "center", backgroundColor: colors.background, flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  loadingText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: "800", padding: 8 },
  errorTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  nav: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    left: 0,
    paddingBottom: 6,
    paddingTop: 9,
    position: "absolute",
    right: 0,
  },
  navItem: { alignItems: "center", flex: 1, gap: 2 },
  checkinNavItem: { marginTop: -27 },
  navIcon: { alignItems: "center", borderRadius: 99, height: 28, justifyContent: "center", width: 44 },
  navIconActive: { backgroundColor: colors.primarySoft },
  checkinFab: { backgroundColor: colors.primaryStrong, borderColor: colors.surface, borderWidth: 4, elevation: 8, height: 62, shadowColor: "#2B1B71", shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.28, shadowRadius: 8, width: 62 },
  checkinFabActive: { backgroundColor: colors.primaryStrong, transform: [{ scale: 1.04 }] },
  checkinFabText: { color: colors.onPrimary, fontSize: 34, fontWeight: "500", lineHeight: 38 },
  checkinLabel: { backgroundColor: colors.surface, borderRadius: 99, color: colors.primary, marginTop: 1, paddingHorizontal: 6, paddingVertical: 1 },
  navEmoji: { color: colors.muted, fontSize: 20, fontWeight: "800" },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  navTextActive: { color: colors.primary },
});
