const http = require('node:http');
const assert = require('node:assert/strict');
const {inspectPort, configuredPort} = require('./start-panel.cjs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const listen = server => new Promise(resolve => server.listen(0, '0.0.0.0', () => resolve(server.address().port)));
const close = server => new Promise(resolve => server.close(resolve));
(async () => {
  assert.equal(configuredPort(root, {PORT:'8090'}), 8090);
  assert.equal(configuredPort(root, {PORT:'8091'}), 8091);
  for (const port of ['abc', '0', '-1', '65536']) assert.throws(() => configuredPort(root, {PORT:port}));
  const panel = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({status:[{label:'vMix'}, {label:'Programm'}, {label:'Sequenzen'}], log:[]}));
  });
  let port = await listen(panel);
  try { assert.equal(await inspectPort(port), 'panel'); } finally { await close(panel); }
  assert.equal(await inspectPort(port), 'free');
  for (const body of ['not JSON', JSON.stringify({status:[], log:[]}), JSON.stringify({status:[{label:'vMix'}], log:[]})]) {
    const other = http.createServer((req, res) => res.end(body));
    port = await listen(other);
    try { assert.equal(await inspectPort(port), 'occupied'); } finally { await close(other); }
  }
  console.log('OK: existing panel recognised, foreign services preserved, free port accepted, configured port and environment override validated.');
})().catch(error => {console.error(error); process.exitCode = 1;});
