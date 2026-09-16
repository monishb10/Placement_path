/* SQL.js (MIT) is served from this site. Every run gets a new, disposable database. */
importScripts('/sql/sql-wasm.js');
const engine = initSqlJs({locateFile: file => '/sql/' + file});
self.onmessage = async event => {
  const {query, setup, caseId, expected, custom} = event.data;
  const started = performance.now();
  let db;
  const result = {caseId, verdict:'ran', stdout:'', stderr:'', compileOutput:'', seconds:null, memoryBytes:null};
  try {
    const SQL = await engine;
    db = new SQL.Database();
    db.run(setup);
    db.run('PRAGMA query_only=ON');
    const rows = [];
    let count = 0;
    for (const statement of db.iterateStatements(query)) {
      if (++count > 1) throw new Error('Write one SELECT query. WITH clauses are allowed.');
      if (statement.getColumnNames().length === 0) throw new Error('The query must return rows.');
      while (statement.step()) {
        if (rows.length >= 1000) {result.verdict='output_limit';throw new Error('Limit exceeded: at most 1,000 result rows.');}
        rows.push(statement.get());
      }
    }
    if (count !== 1) throw new Error('Write a SELECT query first.');
    result.stdout = JSON.stringify(rows);
    if (result.stdout.length > 80000) {result.stdout='';result.verdict='output_limit';throw new Error('Result exceeded 80,000 characters.');}
    result.verdict = custom ? 'ran' : result.stdout === expected ? 'passed' : 'wrong_answer';
  } catch (error) {
    if (result.verdict !== 'output_limit') result.verdict='runtime_error';
    result.stderr=String(error.message || error);
  } finally {
    if (db) db.close();
    result.seconds=(performance.now()-started)/1000;
    self.postMessage(result);
  }
};
