import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useApp } from "../AppContext";
import { COLLECTION_CATALOG, COLLECTIBLES, isCollectibleAvailable, isRoomCollectible, type CatalogItem } from "../collectibles";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ItemArt } from "../components/ItemArt";
import { RoomScene } from "../components/RoomScene";
import { Screen } from "../components/Screen";
import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";
import type { RoomSlot } from "../types";

const RARITY_COLORS: Record<CatalogItem["rarity"], string> = {
  Common: "#7966D6",
  Rare: "#2E89AA",
  Streak: "#C27B24",
  Seasonal: "#A34E72",
};

const RARITY_BACKGROUNDS: Record<CatalogItem["rarity"], string> = {
  Common: "#F1EEFF",
  Rare: "#E7F7FB",
  Streak: "#FFF5D9",
  Seasonal: "#FCEAF2",
};

type CatalogFilter = RoomSlot | "special" | "all";

const filters: Array<{ id: CatalogFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "wall", label: "Walls" },
  { id: "floor", label: "Floors" },
  { id: "window", label: "Windows" },
  { id: "furniture", label: "Furniture" },
  { id: "decor", label: "Decor" },
  { id: "outfit", label: "Outfits" },
  { id: "special", label: "Special" },
];

export function ShopScreen({ initialMode = "shop" }: { initialMode?: "shop" | "collection" }) {
  const { snapshot, buyItem, equipItem, unequipItem } = useApp();
  const [mode, setMode] = useState<"shop" | "collection">(initialMode);
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => setVisibleCount(8), [filter, mode]);

  if (!snapshot) return null;

  const ownedIds = new Set(snapshot.ownedItems.map((item) => item.itemId));
  const catalogOwnedCount = COLLECTION_CATALOG.filter((item) => ownedIds.has(item.id)).length;
  const baseItems = mode === "shop"
    ? COLLECTIBLES.filter((item) => item.price !== null && isCollectibleAvailable(item))
    : COLLECTION_CATALOG;
  const items = filter === "all" ? baseItems : baseItems.filter((item) => item.slot === filter);
  const visibleItems = items.slice(0, visibleCount);
  const owned = selected ? ownedIds.has(selected.id) : false;
  const equipped = selected && isRoomCollectible(selected) ? snapshot.equippedItems[selected.slot] === selected.id : false;
  const available = selected ? isCollectibleAvailable(selected) : false;
  const ownedRecord = selected ? snapshot.ownedItems.find((item) => item.itemId === selected.id) : undefined;

  const purchase = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      Alert.alert("Added to collection", await buyItem(selected.id));
    } catch (error) {
      Alert.alert("Could not purchase", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const togglePlacement = async () => {
    if (!selected || !isRoomCollectible(selected)) return;
    try {
      setBusy(true);
      if (equipped) await unequipItem(selected.slot);
      else await equipItem(selected.id);
    } catch (error) {
      Alert.alert("Could not update room", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Screen title="Treasures" subtitle="Every object has a texture, a story, and a place in your little home.">
        <View style={styles.headerRow}>
          <View style={styles.segment}>
            <Pressable onPress={() => setMode("shop")} style={[styles.segmentButton, mode === "shop" && styles.segmentActive]}><Text style={[styles.segmentText, mode === "shop" && styles.segmentTextActive]}>Shop</Text></Pressable>
            <Pressable onPress={() => setMode("collection")} style={[styles.segmentButton, mode === "collection" && styles.segmentActive]}><Text style={[styles.segmentText, mode === "collection" && styles.segmentTextActive]}>Collection</Text></Pressable>
          </View>
          <View style={styles.balancePill}><Text style={styles.coin}>●</Text><Text style={styles.balance}>{snapshot.pet.coins}</Text></View>
        </View>

        {mode === "collection" ? (
          <Card style={styles.catalogProgress}>
            <View style={styles.catalogRow}><View><Text style={styles.catalogEyebrow}>YOUR TREASURE BOOK</Text><Text style={styles.catalogTitle}>{catalogOwnedCount} of {COLLECTION_CATALOG.length} discovered</Text></View><Text style={styles.catalogPercent}>{Math.round(catalogOwnedCount / COLLECTION_CATALOG.length * 100)}%</Text></View>
            <View style={styles.track}><View style={[styles.progress, { width: `${Math.round(catalogOwnedCount / COLLECTION_CATALOG.length * 100)}%` }]} /></View>
            <Text style={styles.catalogBody}>Rare pieces hide in gifts. Streak keepsakes remember the days you returned—not how little you spent.</Text>
          </Card>
        ) : (
          <View style={styles.shopHero}>
            <ItemArt itemId="mystery_gift" size={86} />
            <View style={styles.shopHeroCopy}><Text style={styles.shopHeroTitle}>Make the room yours</Text><Text style={styles.shopHeroBody}>Preview every piece at home before spending fictional Pet Coins.</Text></View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((item) => (
            <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filterChip, filter === item.id && styles.filterChipActive]}><Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text></Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {visibleItems.map((item) => {
            const itemOwned = ownedIds.has(item.id);
            const itemAvailable = isCollectibleAvailable(item);
            const hidden = !itemOwned && mode === "collection";
            return (
              <Pressable key={item.id} onPress={() => setSelected(item)} style={({ pressed }) => [styles.itemWrap, pressed && styles.pressed]}>
                <Card style={[styles.item, { borderColor: hidden ? colors.border : `${RARITY_COLORS[item.rarity]}55` }]}>
                  <View style={[styles.artStage, { backgroundColor: hidden ? "#EEEAE7" : RARITY_BACKGROUNDS[item.rarity] }]}> 
                    <View style={styles.artGlow} />
                    <ItemArt itemId={item.id} locked={hidden} size={126} />
                    {itemOwned ? <View style={styles.ownedStamp}><Text style={styles.ownedStampText}>OWNED</Text></View> : null}
                    {hidden ? <View style={styles.questionBadge}><Text style={styles.questionText}>?</Text></View> : null}
                  </View>
                  <View style={styles.itemCopy}>
                    <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
                    <Text style={[styles.rarity, { color: hidden ? colors.muted : RARITY_COLORS[item.rarity] }]}>{item.rarity} · {item.slot}</Text>
                    <View style={styles.priceRow}><Text style={styles.itemPrice}>{itemOwned ? (isRoomCollectible(item) && snapshot.equippedItems[item.slot] === item.id ? "In your room" : "Collected") : item.price !== null && itemAvailable ? `${item.price} coins` : itemAvailable ? item.source : "Returns in season"}</Text><Text style={styles.chevron}>›</Text></View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {visibleCount < items.length ? <Button label={`Show more treasures (${items.length - visibleCount})`} onPress={() => setVisibleCount((count) => count + 8)} variant="secondary" /> : null}

        {items.length === 0 ? <Card><Text style={styles.empty}>No pieces in this section yet. Try another category.</Text></Card> : null}

        {mode === "shop" && filter === "all" ? (
          <Pressable onPress={() => buyItem("premium_treat").then((message) => Alert.alert("Treat pouch", message)).catch((error: unknown) => Alert.alert("Could not purchase", error instanceof Error ? error.message : "Something went wrong."))}>
            <Card style={styles.treatCard}><View style={styles.treatArt}><ItemArt itemId="premium_treat" size={92} /></View><View style={styles.treatCopy}><Text style={styles.itemName}>Premium berry biscuit</Text><Text style={styles.catalogBody}>A hand-wrapped snack for pet-care time.</Text><Text style={styles.treatPrice}>12 Pet Coins</Text></View></Card>
          </Pressable>
        ) : null}
      </Screen>

      <Modal animationType="slide" onRequestClose={() => setSelected(null)} transparent visible={selected !== null}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} style={styles.sheet}>
            {selected ? (
              <>
                <View style={[styles.detailArtStage, { backgroundColor: RARITY_BACKGROUNDS[selected.rarity] }]}> 
                  <View style={styles.detailHalo} />
                  <ItemArt itemId={selected.id} locked={!owned && mode === "collection"} size={170} />
                  <View style={[styles.rarityPill, { backgroundColor: RARITY_COLORS[selected.rarity] }]}><Text style={styles.rarityPillText}>{selected.rarity.toUpperCase()}</Text></View>
                </View>
                {isRoomCollectible(selected) && (owned || mode === "shop") ? <RoomScene equipment={snapshot.equippedItems} height={220} petState="curious" petType={snapshot.settings.petType} previewItemId={selected.id} /> : null}
                <View style={styles.detailHeader}><View style={styles.detailCopy}><Text style={styles.detailTitle}>{selected.name}</Text><Text style={[styles.rarity, { color: RARITY_COLORS[selected.rarity] }]}>{selected.rarity} · {selected.slot}</Text></View></View>
                <Text style={styles.detailDescription}>{selected.description}</Text>
                <View style={styles.recordCard}>
                  <Text style={styles.recordTitle}>COLLECTION RECORD</Text>
                  <RecordRow label="Name" value={selected.name} />
                  <RecordRow label="Rarity" value={selected.rarity} />
                  <RecordRow label="Obtained" value={ownedRecord ? new Date(ownedRecord.acquiredAt).toLocaleDateString() : "Not collected yet"} />
                  <RecordRow label="How" value={ownedRecord?.source ?? selected.source} />
                  <RecordRow label="Owned" value={owned ? "Yes" : "No"} />
                  <RecordRow label="Equipped" value={isRoomCollectible(selected) ? (equipped ? "Yes · in your room" : "No") : "Not equippable"} />
                </View>
                <Text style={styles.storyLabel}>ITEM STORY</Text>
                <Text style={styles.story}>“{selected.story}”</Text>
                {owned && isRoomCollectible(selected) ? <Button disabled={busy} label={equipped ? "Remove from room" : "Place in my room"} onPress={togglePlacement} variant={equipped ? "secondary" : "primary"} />
                  : !owned && selected.price !== null && available ? <Button disabled={busy} label={`Buy for ${selected.price} coins`} onPress={purchase} />
                  : <Button disabled label={available ? `Find in ${selected.source}` : "Not in season"} onPress={() => undefined} />}
                <Button label="Close" onPress={() => setSelected(null)} variant="secondary" />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.recordRow}><Text style={styles.recordLabel}>{label}</Text><Text style={styles.recordValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  headerRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  segment: { backgroundColor: colors.primarySoft, borderRadius: 14, flexDirection: "row", padding: 3 },
  segmentButton: { borderRadius: 11, paddingHorizontal: 16, paddingVertical: 9 },
  segmentActive: { backgroundColor: colors.surface, shadowColor: "#3F315F", shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.12, shadowRadius: 5 },
  segmentText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  segmentTextActive: { color: colors.primary },
  balancePill: { alignItems: "center", backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder, borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 12, paddingVertical: 7 },
  coin: { color: "#D79D26", fontSize: 14 },
  balance: { color: colors.text, fontSize: 15, fontWeight: "900" },
  shopHero: { alignItems: "center", backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder, borderRadius: 22, borderWidth: 1, flexDirection: "row", minHeight: 112, overflow: "hidden", paddingHorizontal: 14 },
  shopHeroCopy: { flex: 1, paddingLeft: 8 },
  shopHeroTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  shopHeroBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  catalogProgress: { backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder, gap: spacing.sm },
  catalogRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  catalogEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  catalogTitle: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 3 },
  catalogPercent: { color: colors.primary, fontSize: 23, fontWeight: "900" },
  catalogBody: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  track: { backgroundColor: colors.track, borderRadius: 99, height: 8, overflow: "hidden" },
  progress: { backgroundColor: colors.primary, borderRadius: 99, height: "100%" },
  filterRow: { gap: 7, paddingRight: spacing.md },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  filterChipActive: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  filterTextActive: { color: colors.onPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  itemWrap: { width: "48%" },
  item: { minHeight: 244, overflow: "hidden", padding: 0 },
  artStage: { alignItems: "center", height: 150, justifyContent: "center", overflow: "hidden", position: "relative" },
  artGlow: { backgroundColor: "rgba(255,255,255,.62)", borderRadius: 80, height: 116, position: "absolute", width: 116 },
  ownedStamp: { backgroundColor: "rgba(52,42,72,.82)", borderRadius: 99, bottom: 8, paddingHorizontal: 8, paddingVertical: 4, position: "absolute", right: 8 },
  ownedStampText: { color: "#FFFFFF", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  questionBadge: { alignItems: "center", backgroundColor: "rgba(58,49,68,.72)", borderRadius: 99, height: 28, justifyContent: "center", position: "absolute", width: 28 },
  questionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  itemCopy: { flex: 1, gap: 4, padding: 11 },
  itemName: { color: colors.text, fontSize: 14, fontWeight: "900", lineHeight: 18 },
  rarity: { fontSize: 9, fontWeight: "900", letterSpacing: 0.55, textTransform: "uppercase" },
  priceRow: { alignItems: "center", flexDirection: "row", marginTop: "auto" },
  itemPrice: { color: colors.muted, flex: 1, fontSize: 10, fontWeight: "700" },
  chevron: { color: colors.primary, fontSize: 20, fontWeight: "900", lineHeight: 20 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  empty: { color: colors.muted, fontSize: 13, textAlign: "center" },
  treatCard: { alignItems: "center", backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder, flexDirection: "row", overflow: "hidden", padding: 10 },
  treatArt: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 17, height: 94, justifyContent: "center", width: 102 },
  treatCopy: { flex: 1, paddingHorizontal: 12 },
  treatPrice: { color: colors.primary, fontSize: 12, fontWeight: "900", marginTop: 7 },
  overlay: { backgroundColor: "rgba(30,24,44,.52)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "96%" },
  sheetContent: { gap: spacing.sm, padding: spacing.lg, paddingBottom: 34 },
  detailArtStage: { alignItems: "center", borderRadius: 22, height: 190, justifyContent: "center", overflow: "hidden" },
  detailHalo: { backgroundColor: "rgba(255,255,255,.64)", borderRadius: 90, height: 158, position: "absolute", width: 158 },
  rarityPill: { borderRadius: 99, bottom: 10, paddingHorizontal: 10, paddingVertical: 5, position: "absolute", right: 10 },
  rarityPillText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  detailHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  detailDescription: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  recordCard: { backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder, borderRadius: 16, borderWidth: 1, padding: 12 },
  recordTitle: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 5 },
  recordRow: { alignItems: "flex-start", borderBottomColor: "rgba(109,92,145,.10)", borderBottomWidth: 1, flexDirection: "row", gap: 12, paddingVertical: 7 },
  recordLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", width: 70 },
  recordValue: { color: colors.text, flex: 1, fontSize: 11, fontWeight: "700", textAlign: "right" },
  storyLabel: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  story: { backgroundColor: colors.primarySoft, borderRadius: 14, color: colors.text, fontSize: 12, fontStyle: "italic", lineHeight: 18, padding: 12 },
  acquired: { color: colors.muted, fontSize: 10, fontWeight: "700" },
});
