# Validation — 1.11.7 / build 61

Date: 2026-10-18. Environment: Linux, Node 24.19.0, Expo 57.0.27, React Native 0.86.3.

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| Full automated suite | PASS — 153 tests, zero failures |
| Financial SQL | PASS — real SQLite, 301/1,000/10,000 rows and three pagination sizes |
| Calendar semantics | PASS — five timezone subprocesses, spring/fall DST and leap/year boundaries |
| Production context mutations | PASS — streak, rewards, concurrency, edit/delete and rollback/retry |
| Async query hooks | PASS — stale response protection, retry, pagination locking |
| Existing animations | PASS — retained regression suite |
| Old database rows | PASS — unchanged after repeated migration/snapshot read |
| iOS JavaScript/assets export | PASS |
| Native IPA / iPhone / iPad | NOT RUN — no macOS/Xcode or signed native build |

Exact command outputs are in `finance-1.11.7/typecheck.txt`, `finance-1.11.7/tests.txt` and `finance-1.11.7/ios-export.txt`.

The SQLite tests execute production SQL and production context mutation handlers through a Node SQLite adapter. They do not replace device testing of expo-sqlite connections and platform localtime behavior. Package/lockfile pin date-fns 4.1.0. The existing Expo patch compatibility advisory (57.0.27 versus currently recommended ~57.0.30) remains outside this two-issue refactor.
