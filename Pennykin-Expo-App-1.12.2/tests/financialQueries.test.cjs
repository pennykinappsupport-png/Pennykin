const assert=require('node:assert/strict'),test=require('node:test');
const {sqliteFixture}=require('./helpers/sqliteFixture.cjs');
const {getSpendingSummary,getBudgetActuals,getTransactionsPage}=require('../.test-build/src/transactionQueries.js');
const {buildSpendingAnalytics,periodWindow}=require('../.test-build/src/analytics.js');
const {todayKey,addCalendarDays}=require('../.test-build/src/date.js');
const {migrateDbIfNeeded,loadSnapshot}=require('../.test-build/src/database.js');
const {getBudgetMetrics}=require('../.test-build/src/budget.js');
async function setup(t){const f=sqliteFixture();t.after(f.close);await migrateDbIfNeeded(f.db);return f;}
function insert(sqlite,id,cents,date,category='Food',need='Need',instant=new Date(`${date}T12:00:00`).toISOString()){sqlite.prepare('INSERT INTO transactions(id,amount_cents,category,note,need_want,transaction_date,created_at) VALUES(?,?,?,?,?,?,?)').run(id,cents,category,category,need,date,instant);}
async function report(db,period,offset=0,now=new Date(2026,8,24,15)){
 const {start,end}=periodWindow(period,offset,now);
 return buildSpendingAnalytics(await getSpendingSummary(db,{startKey:todayKey(start),endExclusiveKey:addCalendarDays(todayKey(end),1)},period),period,offset,now);
}
for(const count of [301,1000,10000])test(`${count} records: complete SQL totals, categories, counts and all page sizes agree`,async t=>{
 const {db,sqlite}=await setup(t);sqlite.exec('BEGIN');
 for(let i=1;i<=count;i++)insert(sqlite,i,i%100+1,'2026-09-24',i%2?'Food':'Other',i%3?'Need':'Want');
 sqlite.exec('COMMIT');
 const expected=sqlite.prepare('SELECT SUM(amount_cents) total,COUNT(*) count FROM transactions').get();
 for(const period of ['day','week','month','year']){
  const r=await report(db,period);assert.equal(r.totalCents,expected.total);assert.equal(r.entryCount,count);
  assert.equal(r.categories.reduce((s,c)=>s+c.amountCents,0),r.totalCents);
  assert.equal(r.buckets.at(-1).cumulativeCents,r.totalCents);
 }
 const range={startKey:'2026-09-24',endExclusiveKey:'2026-09-25'};
 for(const pageSize of [7,50,200]){
  let cursor=null,ids=[];do{const page=await getTransactionsPage(db,range,cursor,pageSize);ids.push(...page.items.map(x=>x.id));cursor=page.nextCursor;}while(cursor);
  assert.equal(ids.length,count);assert.equal(new Set(ids).size,count);assert.equal(ids[0],count);assert.equal(ids.at(-1),1);
 }
 const snapshot=await loadSnapshot(db,new Date(2026,8,24));assert.equal(snapshot.financialActuals.totalCents,expected.total);assert.equal(snapshot.financialActuals.todayCount,count);
 assert.ok(!('transactions'in snapshot));
});
test('actual SQL preserves day/week/month/year chart behavior and exact boundaries',async t=>{
 const {db,sqlite}=await setup(t);
 insert(sqlite,1,1200,'2026-09-21');insert(sqlite,2,800,'2026-09-23','Transport');
 insert(sqlite,3,500,'2026-09-24','Entertainment','Want',new Date('2026-09-24T17:30:00').toISOString());
 insert(sqlite,4,3000,'2026-08-10','Shopping','Want');insert(sqlite,5,9999,'2027-01-01');
 const week=await report(db,'week');assert.equal(week.totalCents,2500);assert.deepEqual(week.buckets.map(x=>x.amountCents),[1200,0,800,500,0,0,0]);
 assert.deepEqual(week.categories.map(x=>[x.category,x.percent]),[['Food',48],['Transport',32],['Entertainment',20]]);
 const month=await report(db,'month');assert.equal(month.entryCount,3);assert.equal(month.totalCents,2500);
 const year=await report(db,'year');assert.equal(year.totalCents,5500);assert.equal(year.buckets[7].amountCents,3000);assert.equal(year.buckets[8].amountCents,2500);
 const day=await report(db,'day');assert.equal(day.needsCents,0);assert.equal(day.wantsCents,500);assert.equal(day.buckets[4].amountCents,500);assert.equal(day.averageCents,500);
 const empty=await report(db,'week',-2);assert.equal(empty.totalCents,0);assert.equal(empty.averageCents,0);assert.equal(empty.entryCount,0);assert.deepEqual(empty.categories,[]);assert.ok(empty.buckets.every(x=>x.cumulativeCents===0));
});
test('insert, edit, delete immediately update actual database reports and budget',async t=>{
 const {db,sqlite}=await setup(t);const now=new Date(2026,8,24);
 insert(sqlite,1,1234,'2026-09-24');assert.equal((await getBudgetActuals(db,now)).totalCents,1234);
 sqlite.prepare("UPDATE transactions SET amount_cents=5678,category='Transport',need_want='Want' WHERE id=1").run();
 const r=await report(db,'month');assert.equal(r.totalCents,5678);assert.equal(r.needsCents,0);assert.equal(r.categories[0].category,'Transport');
 const a=await getBudgetActuals(db,now);assert.equal(a.todaySpentCents,5678);assert.equal(a.categorySpentCents.Transport,5678);
 sqlite.prepare('DELETE FROM transactions WHERE id=1').run();assert.equal((await report(db,'year')).totalCents,0);assert.equal((await getBudgetActuals(db,now)).todayCount,0);
});
test('reopening/migrating an old database preserves every financial row and civil date',async t=>{
 const {db,sqlite}=await setup(t);insert(sqlite,1,137,'2024-02-29');insert(sqlite,2,299,'2025-12-31');
 const before=sqlite.prepare('SELECT * FROM transactions ORDER BY id').all();await migrateDbIfNeeded(db);await loadSnapshot(db);
 assert.deepEqual(sqlite.prepare('SELECT * FROM transactions ORDER BY id').all(),before);
});
test('budget week has an exclusive upper boundary and explicit complete counts',async t=>{
 const {db,sqlite}=await setup(t);insert(sqlite,1,111,'2026-09-20');insert(sqlite,2,222,'2026-09-21');insert(sqlite,3,333,'2026-09-23');insert(sqlite,4,444,'2026-09-24');insert(sqlite,5,555,'2026-09-28');
 const a=await getBudgetActuals(db,new Date(2026,8,24));assert.equal(a.totalCents,999);assert.equal(a.yesterdaySpentCents,333);assert.equal(a.todayCount,1);
 const m=getBudgetMetrics({financialActuals:a,settings:{weeklyBudgetCents:7000},categoryBudgets:[],reservedExpenses:[],savingsGoal:null});assert.equal(m.remainingDays,4);assert.equal(m.safeTodayCents,1500);
});
