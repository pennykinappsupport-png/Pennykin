const assert=require('node:assert/strict'),test=require('node:test');
const {sqliteFixture}=require('./helpers/sqliteFixture.cjs');
const {appContextFixture}=require('./helpers/appContextFixture.cjs');
const {migrateDbIfNeeded}=require('../.test-build/src/database.js');
const {getBudgetMetrics}=require('../.test-build/src/budget.js');
const input=amountCents=>({amountCents,category:'Food',note:'Lunch',needWant:'Need'});
process.env.TZ='America/New_York';
async function setup(t,now=new Date(2026,2,8,15)){
 const f=sqliteFixture();t.after(f.close);await migrateDbIfNeeded(f.db);
 const app=appContextFixture(f.db,now);await app.render().refresh();return{...f,app};
}
test('real context preserves streak across spring DST and commits budget/reward together',async t=>{
 const {db,app}=await setup(t);await db.runAsync("UPDATE settings SET last_checkin_date='2026-03-07',checkin_streak=6,weekly_budget_cents=7000");
 await app.render().saveTransaction(input(1000));
 const snapshot=app.render().snapshot;assert.equal(snapshot.settings.checkinStreak,7);assert.equal(snapshot.settings.lastCheckinDate,'2026-03-08');
 assert.equal(snapshot.financialActuals.totalCents,1000);assert.equal(snapshot.financialActuals.todayCount,1);
 assert.equal(getBudgetMetrics(snapshot).safeTodayCents,6000);assert.ok(snapshot.pendingGifts.some(x=>x.milestoneDay===7));
 await app.render().saveTransaction(input(500));assert.equal(app.render().snapshot.settings.checkinStreak,7);
});
test('real context serializes concurrent check-ins, refreshes and pagination-independent rewards',async t=>{
 const {db,app}=await setup(t);const api=app.render();
 await Promise.all([api.saveTransaction(input(100)),api.refresh(),api.saveTransaction(input(200)),api.saveTransaction(input(300))]);
 const s=app.render().snapshot;assert.equal(s.financialActuals.todayCount,3);assert.equal(s.financialActuals.todaySpentCents,600);
 assert.equal((await db.getFirstAsync("SELECT COUNT(*) count FROM gift_boxes WHERE source='daily-entries-2026-03-08'")).count,1);
 assert.equal((await db.getFirstAsync('SELECT COUNT(*) count FROM daily_checkins')).count,1);
 const row=await db.getFirstAsync('SELECT id FROM transactions ORDER BY id LIMIT 1');
 await app.render().saveTransaction({...input(700),id:row.id});assert.equal(app.render().snapshot.financialActuals.totalCents,1200);
 await app.render().deleteTransaction(row.id);assert.equal(app.render().snapshot.financialActuals.totalCents,500);
});
test('a failed financial write rolls back expense and rewards, and queue accepts retry',async t=>{
 const {db,sqlite,app}=await setup(t);const before=await db.getFirstAsync('SELECT * FROM pet_state');
 sqlite.exec("CREATE TRIGGER reject_badge BEFORE INSERT ON badges BEGIN SELECT RAISE(ABORT, 'forced rollback'); END;");
 await assert.rejects(app.render().saveTransaction(input(100)),/forced rollback/);
 assert.equal((await db.getFirstAsync('SELECT COUNT(*) count FROM transactions')).count,0);assert.equal((await db.getFirstAsync('SELECT COUNT(*) count FROM daily_checkins')).count,0);
 assert.deepEqual(await db.getFirstAsync('SELECT * FROM pet_state'),before);
 sqlite.exec('DROP TRIGGER reject_badge');await app.render().saveTransaction(input(100));assert.equal(app.render().snapshot.financialActuals.todayCount,1);
});
test('fall DST, midnight and device timezone changes preserve local-date rules and existing rows',async t=>{
 const {db,app}=await setup(t,new Date(2026,9,31,23,59));await app.render().saveTransaction(input(100));
 app.setNow(new Date(2026,10,1,0,1));await app.render().saveTransaction(input(200));assert.equal(app.render().snapshot.settings.checkinStreak,2);
 const before=await db.getAllAsync('SELECT transaction_date,created_at FROM transactions ORDER BY id');
 process.env.TZ='Asia/Shanghai';await app.render().refresh();const after=await db.getAllAsync('SELECT transaction_date,created_at FROM transactions ORDER BY id');
 assert.deepEqual(after,before);assert.match(app.render().snapshot.calendarContext,/Asia\/Shanghai/);
 process.env.TZ='America/New_York';
});
test('queued Want explanations use the latest committed balance, not the caller render',async t=>{
 const {db,app}=await setup(t);await db.runAsync('UPDATE settings SET weekly_budget_cents=7000');await app.render().refresh();
 const api=app.render();await api.saveTransaction({...input(1000),needWant:'Want'});await api.saveTransaction({...input(1000),needWant:'Want'});
 assert.match(app.render().roomEvent.moneyInsight.lines[0],/0.2 days/); // 1000 / remaining 6000, not 7000
 assert.match(app.render().roomEvent.moneyInsight.lines[1],/16.7%/);
});
