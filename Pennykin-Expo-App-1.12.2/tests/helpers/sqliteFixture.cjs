const {DatabaseSync}=require('node:sqlite');
function sqliteFixture(){
 const sqlite=new DatabaseSync(':memory:');
 const db={
  getAllAsync:async(sql,...params)=>sqlite.prepare(sql).all(...params),
  getFirstAsync:async(sql,...params)=>sqlite.prepare(sql).get(...params)??null,
  runAsync:async(sql,...params)=>{const r=sqlite.prepare(sql).run(...params);return{changes:Number(r.changes),lastInsertRowId:Number(r.lastInsertRowid)};},
  execAsync:async(sql)=>sqlite.exec(sql),
  withTransactionAsync:async fn=>{sqlite.exec('BEGIN');try{await fn();sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}},
  withExclusiveTransactionAsync:async fn=>{sqlite.exec('BEGIN');try{await fn(db);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}},
 };
 return {db,sqlite,close:()=>sqlite.close()};
}
module.exports={sqliteFixture};
