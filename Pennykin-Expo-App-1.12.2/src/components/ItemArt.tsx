import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { ITEM_IMAGES } from "../itemImages";

const loadedItemIds = new Set<string>();

export function ItemArt({ itemId, size = 96, locked = false, style }: { itemId: string; size?: number; locked?: boolean; style?: StyleProp<ViewStyle> }) {
  const source = ITEM_IMAGES[itemId];
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loaded, setLoaded] = useState(() => loadedItemIds.has(itemId));
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoaded(loadedItemIds.has(itemId));
    setRetryKey(0);
  }, [itemId]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  if (!source) return null;
  return (
    <View style={[styles.wrap, { height: size, width: size }, style]}>
      {!loaded ? <View style={styles.fallback}><View style={styles.fallbackHalo} /><Text style={[styles.fallbackSparkle, { fontSize: size * 0.25 }]}>✦</Text><Text numberOfLines={1} style={[styles.fallbackLabel, { fontSize: Math.max(6, size * 0.065) }]}>{itemId.replaceAll("_", " ")}</Text></View> : null}
      <Image
        blurRadius={locked ? 7 : 0}
        fadeDuration={0}
        key={`${itemId}-${retryKey}`}
        onError={() => {
          setLoaded(false);
          if (retryKey < 1) retryTimer.current = setTimeout(() => setRetryKey((value) => value + 1), 800);
        }}
        onLoad={() => {
          loadedItemIds.add(itemId);
          setLoaded(true);
        }}
        resizeMode="contain"
        source={source}
        style={[styles.image, { opacity: loaded ? (locked ? 0.48 : 1) : 0 }]}
      />
      {locked ? <View style={styles.mist} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: "#49365A",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },
  image: { height: "100%", width: "100%" },
  fallback: { alignItems: "center", backgroundColor: "rgba(255,255,255,.46)", borderColor: "rgba(101,79,146,.16)", borderRadius: 22, borderWidth: 1, bottom: "10%", justifyContent: "center", left: "10%", overflow: "hidden", position: "absolute", right: "10%", top: "10%" },
  fallbackHalo: { backgroundColor: "rgba(218,207,248,.7)", borderRadius: 99, height: "68%", position: "absolute", transform: [{ rotate: "-18deg" }], width: "68%" },
  fallbackLabel: { bottom: 5, color: "#756A80", fontWeight: "900", left: 4, position: "absolute", right: 4, textAlign: "center", textTransform: "uppercase" },
  fallbackSparkle: { color: "#8069D9", fontWeight: "900" },
  mist: { backgroundColor: "rgba(235,230,239,.18)", borderRadius: 99, bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
});
