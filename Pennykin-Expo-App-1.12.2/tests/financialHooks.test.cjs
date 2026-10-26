const assert=require('node:assert/strict'),test=require('node:test');
const {financialHookFixture}=require('./helpers/financialHookFixture.cjs');
const snapshot=()=>({financialActuals:{dateKey:'2026-09-24'}});
const totals=n=>[{kind:'total',key:'',totalCents:n,needsCents:n,entryCount:1}];
const row=id=>({id,amount_cents:100,category:'Food',note:'Lunch',need_want:'Need',transaction_date:'2026-09-24',created_at:'2026-09-24T12:00:00Z'});
test('late report and failed prior period cannot replace the newest selected month',async()=>{
 const f=financialHookFixture('useSpendingReports'),s=snapshot();
 f.render(s,'week',0);f.render(s,'month',-1);
 f.queries[2].resolve(totals(2200));f.queries[3].resolve(totals(1100));await f.flush();
 assert.equal(f.render().current.totalCents,2200);
 f.queries[0].resolve(totals(9999));f.queries[1].reject(new Error('old failure'));await f.flush();
 assert.equal(f.render().current.totalCents,2200);assert.equal(f.render().error,null);
});
test('current report failure is visible and retry loads complete reports',async()=>{
 const f=financialHookFixture('useSpendingReports');f.render(snapshot(),'month',0);
 f.queries[0].reject(new Error('disk read failed'));f.queries[1].resolve(totals(0));await f.flush();
 assert.equal(f.render().error,'disk read failed');f.render().retry();f.render();
 f.queries[2].resolve(totals(3300));f.queries[3].resolve(totals(2200));await f.flush();
 assert.equal(f.render().current.totalCents,3300);assert.equal(f.render().error,null);
});
test('pagination ignores old snapshot results and locks repeated load-more taps',async()=>{
 const f=financialHookFixture('useTodayTransactions'),a=snapshot(),b=snapshot();
 f.render(a);f.render(b);f.queries[0].resolve([row(999)]);f.queries[1].resolve(Array.from({length:51},(_,i)=>row(100-i)));await f.flush();
 let state=f.render();assert.equal(state.items.length,50);assert.equal(state.items[0].id,100);assert.equal(state.hasMore,true);
 const first=state.loadMore(),duplicate=state.loadMore();assert.equal(f.queries.length,3);
 const c=snapshot();f.render(c);f.queries[3].resolve([row(200)]);await f.flush();
 f.queries[2].resolve([row(50)]);await Promise.all([first,duplicate]);await f.flush();
 state=f.render();assert.equal(state.items.length,1);assert.equal(state.items[0].id,200);assert.equal(state.hasMore,false);
});
