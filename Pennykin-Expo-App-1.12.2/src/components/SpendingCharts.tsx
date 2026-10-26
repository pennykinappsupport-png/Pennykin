import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import type { SpendingBucket, SpendingCategory } from "../analytics";
import { formatMoney } from "../date";
import { AppText as Text } from "../display";
import { colors, spacing } from "../theme";

export const CATEGORY_COLOR_BY_NAME: Record<string, string> = {
  Food: "#E3C878",
  Transport: "#8FB6D8",
  School: "#8FC2A3",
  Entertainment: "#B2A0D4",
  Shopping: "#DDA7BC",
  Other: "#B5B3B8",
};
const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍴",
  Transport: "🚌",
  School: "🎓",
  Entertainment: "🎮",
  Shopping: "🛍",
  Other: "•",
};

function categoryColor(category: string) {
  return CATEGORY_COLOR_BY_NAME[category] ?? CATEGORY_COLOR_BY_NAME.Other;
}

function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars >= 10_000 ? 0 : 1)}k`;
  if (dollars >= 100) return `$${Math.round(dollars)}`;
  return `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 1)}`;
}

export function SpendingTrendChart({ buckets }: { buckets: SpendingBucket[] }) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const palette = {
    bar: dark ? "#9C8CFA" : "#6B56D9",
    grid: dark ? "#4A4252" : "#E9E1DA",
    line: dark ? "#FFB08F" : "#E97850",
    muted: dark ? "#C3BBCD" : "#6F687E",
    surface: dark ? "#231E2B" : "#FFFFFF",
  };
  const width = 320;
  const height = 194;
  const left = 36;
  const right = 8;
  const top = 16;
  const bottom = 31;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxCents = Math.max(1, ...buckets.map((bucket) => bucket.amountCents), ...buckets.map((bucket) => bucket.cumulativeCents));
  const step = plotWidth / Math.max(1, buckets.length);
  const barWidth = Math.max(7, Math.min(24, step * 0.46));
  const points = buckets.map((bucket, index) => {
    const x = left + step * index + step / 2;
    const y = top + plotHeight - (bucket.cumulativeCents / maxCents) * plotHeight;
    return `${x},${y}`;
  }).join(" ");
  const hasData = buckets.some((bucket) => bucket.amountCents > 0);

  return (
    <View accessibilityLabel="Spending bars with a cumulative spending line" accessibilityRole="image" style={styles.chartWrap}>
      <Svg height={height} viewBox={`0 0 ${width} ${height}`} width="100%">
        {[0, 0.5, 1].map((ratio) => {
          const y = top + plotHeight * (1 - ratio);
          return <Line key={ratio} stroke={palette.grid} strokeDasharray={ratio === 0 ? undefined : "4 5"} strokeWidth="1" x1={left} x2={width - right} y1={y} y2={y} />;
        })}
        <SvgText fill={palette.muted} fontSize="9" textAnchor="end" x={left - 6} y={top + 3}>{compactMoney(maxCents)}</SvgText>
        <SvgText fill={palette.muted} fontSize="9" textAnchor="end" x={left - 6} y={top + plotHeight + 3}>$0</SvgText>
        {buckets.map((bucket, index) => {
          const x = left + step * index + (step - barWidth) / 2;
          const barHeight = (bucket.amountCents / maxCents) * plotHeight;
          return (
            <G key={bucket.key}>
              <Rect fill={palette.bar} height={Math.max(0, barHeight)} opacity={0.76} rx="4" width={barWidth} x={x} y={top + plotHeight - barHeight} />
              <SvgText fill={palette.muted} fontSize={buckets.length > 8 ? "7.5" : "9"} textAnchor="middle" x={left + step * index + step / 2} y={height - 9}>{bucket.label}</SvgText>
            </G>
          );
        })}
        {hasData ? <>
          <Polyline fill="none" points={points} stroke={palette.line} strokeLinejoin="round" strokeWidth="2.5" />
          {buckets.map((bucket, index) => <Circle cx={left + step * index + step / 2} cy={top + plotHeight - (bucket.cumulativeCents / maxCents) * plotHeight} fill={palette.surface} key={`point-${bucket.key}`} r="3.5" stroke={palette.line} strokeWidth="2" />)}
        </> : null}
      </Svg>
      {!hasData ? <View pointerEvents="none" style={styles.emptyOverlay}><Text style={styles.emptyTitle}>No spending yet</Text><Text style={styles.emptyCopy}>Your next check-in will appear here.</Text></View> : null}
    </View>
  );
}

export function CategoryDonutChart({ categories, totalCents }: { categories: SpendingCategory[]; totalCents: number }) {
  const scheme = useColorScheme();
  const track = scheme === "dark" ? "#3A3440" : "#EEE9E3";
  const circumference = 2 * Math.PI * 43;
  let progress = 0;
  return (
    <View accessibilityLabel="Spending by category" accessibilityRole="image" style={styles.donutWrap}>
      <Svg height="148" viewBox="0 0 148 148" width="148">
        <Circle cx="74" cy="74" fill="none" r="43" stroke={track} strokeWidth="22" />
        {categories.map((category) => {
          const share = totalCents === 0 ? 0 : category.amountCents / totalCents;
          const dash = Math.max(0, circumference * share - 1.5);
          const rotation = progress * 360 - 90;
          progress += share;
          return <Circle cx="74" cy="74" fill="none" key={category.category} r="43" stroke={categoryColor(category.category)} strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="butt" strokeWidth="22" transform={`rotate(${rotation} 74 74)`} />;
        })}
        <SvgText fill={scheme === "dark" ? "#F7F3FF" : "#28243A"} fontSize="18" fontWeight="800" textAnchor="middle" x="74" y="72">{compactMoney(totalCents)}</SvgText>
        <SvgText fill={scheme === "dark" ? "#C3BBCD" : "#6F687E"} fontSize="9" textAnchor="middle" x="74" y="88">total</SvgText>
      </Svg>
    </View>
  );
}

export function CategoryRanking({ categories }: { categories: SpendingCategory[] }) {
  const max = Math.max(1, ...categories.map((category) => category.amountCents));
  if (categories.length === 0) return <Text style={styles.noCategories}>No category spending in this period.</Text>;
  return (
    <View style={styles.ranking}>
      {categories.map((category) => (
        <View key={category.category} style={styles.rankRow}>
          <View style={styles.rankTop}>
            <Text style={styles.rankName}>{CATEGORY_ICONS[category.category] ?? "•"}  {category.category}</Text>
            <Text style={styles.rankPercent}>{category.percent}%</Text>
            <Text style={styles.rankAmount}>{formatMoney(category.amountCents)}</Text>
          </View>
          <View style={styles.rankTrack}><View style={[styles.rankFill, { backgroundColor: categoryColor(category.category), width: `${Math.max(4, (category.amountCents / max) * 100)}%` }]} /></View>
        </View>
      ))}
    </View>
  );
}

export function ChartLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}><View style={styles.barLegend} /><Text style={styles.legendText}>Period spending</Text></View>
      <View style={styles.legendItem}><View style={styles.lineLegend} /><Text style={styles.legendText}>Cumulative</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: { minHeight: 194, position: "relative", width: "100%" },
  emptyOverlay: { alignItems: "center", bottom: 40, justifyContent: "center", left: 42, position: "absolute", right: 8, top: 18 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  emptyCopy: { color: colors.muted, fontSize: 10, marginTop: 3 },
  donutWrap: { alignItems: "center", justifyContent: "center" },
  noCategories: { color: colors.muted, fontSize: 12, paddingVertical: spacing.lg, textAlign: "center" },
  ranking: { gap: 13 },
  rankRow: { gap: 6 },
  rankTop: { alignItems: "center", flexDirection: "row" },
  rankName: { color: colors.text, flex: 1, fontSize: 13, fontWeight: "800" },
  rankPercent: { color: colors.muted, fontSize: 11, fontWeight: "700", marginRight: 12 },
  rankAmount: { color: colors.text, fontSize: 12, fontWeight: "900", minWidth: 68, textAlign: "right" },
  rankTrack: { backgroundColor: colors.track, borderRadius: 99, height: 7, overflow: "hidden" },
  rankFill: { borderRadius: 99, height: "100%" },
  legend: { flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  legendText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  barLegend: { backgroundColor: colors.primary, borderRadius: 3, height: 10, opacity: 0.76, width: 10 },
  lineLegend: { backgroundColor: colors.secondary, borderRadius: 99, height: 3, width: 15 },
});
