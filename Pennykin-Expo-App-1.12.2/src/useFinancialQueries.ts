import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { addCalendarDays, parseDateKey, todayKey } from "./date";
import { buildSpendingAnalytics, periodWindow, type AnalyticsPeriod, type SpendingAnalytics } from "./analytics";
import { getSpendingSummary, getTransactionsPage, type TransactionPage } from "./transactionQueries";
import type { Snapshot } from "./types";

export function useSpendingReports(snapshot: Snapshot | null, period: AnalyticsPeriod, offset: number) {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ snapshot: Snapshot; period: AnalyticsPeriod; offset: number; current: SpendingAnalytics; previous: SpendingAnalytics } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(null);
    if (snapshot) {
      const now = parseDateKey(snapshot.financialActuals.dateKey);
      const read = async (selectedOffset: number) => {
        const { start, end } = periodWindow(period, selectedOffset, now);
        const summary = await getSpendingSummary(db, { startKey: todayKey(start), endExclusiveKey: addCalendarDays(todayKey(end), 1) }, period);
        return buildSpendingAnalytics(summary, period, selectedOffset, now);
      };
      Promise.all([read(offset), read(offset - 1)]).then(([current, previous]) => {
        if (active) setState({ snapshot, period, offset, current, previous });
      }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load spending."); });
    }
    return () => { active = false; };
  }, [db, snapshot, period, offset, attempt]);
  const matches = state?.snapshot === snapshot && state?.period === period && state?.offset === offset;
  return { current: matches ? state.current : null, previous: matches ? state.previous : null, error, retry: () => setAttempt((value) => value + 1) };
}

export function useTodayTransactions(snapshot: Snapshot | null) {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ snapshot: Snapshot; page: TransactionPage } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const loadingMore = useRef(false);
  useEffect(() => {
    const version = ++generation.current;
    loadingMore.current = false;
    setBusy(true);
    setError(null);
    if (snapshot) {
      const startKey = snapshot.financialActuals.dateKey;
      getTransactionsPage(db, { startKey, endExclusiveKey: addCalendarDays(startKey, 1) }).then((page) => {
        if (version === generation.current) setState({ snapshot, page });
      }).catch((reason: unknown) => { if (version === generation.current) setError(reason instanceof Error ? reason.message : "Could not load entries."); })
        .finally(() => { if (version === generation.current) setBusy(false); });
    }
    return () => { generation.current++; };
  }, [db, snapshot, attempt]);
  const page = state?.snapshot === snapshot ? state.page : null;
  const loadMore = async () => {
    if (!snapshot || !page?.nextCursor || loadingMore.current || busy) return;
    loadingMore.current = true;
    const version = generation.current;
    setBusy(true); setError(null);
    try {
      const startKey = snapshot.financialActuals.dateKey;
      const next = await getTransactionsPage(db, { startKey, endExclusiveKey: addCalendarDays(startKey, 1) }, page.nextCursor);
      if (version === generation.current) setState({ snapshot, page: { items: [...page.items, ...next.items], nextCursor: next.nextCursor } });
    } catch (reason) {
      if (version === generation.current) setError(reason instanceof Error ? reason.message : "Could not load entries.");
    } finally {
      if (version === generation.current) { setBusy(false); loadingMore.current = false; }
    }
  };
  return { items: page?.items ?? [], hasMore: !!page?.nextCursor, loading: busy, error, loadMore,
    retry: () => { if (page?.nextCursor) void loadMore(); else setAttempt((value) => value + 1); } };
}
