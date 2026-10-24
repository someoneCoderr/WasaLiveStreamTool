const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'dist/server.cjs');
const bundle = fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
const marker = '// server/index.ts\nvar ROOT';
assert.equal(bundle.split(marker).length, 2);
const isolated = new Module(filename, module);
isolated.filename = filename;
isolated.paths = module.paths;
isolated._compile(bundle.split(marker)[0] + '\nmodule.exports = { ManualScoreboard, clockFields, loadConfig };', filename);
const {ManualScoreboard, clockFields, loadConfig} = isolated.exports;
const cfg = loadConfig(root);
let now = 1000000;
const realNow = Date.now;
Date.now = () => now;
const title = {forget() {}, write: async () => {}};
const create = data => new ManualScoreboard(cfg.scoreboard.manual, title, () => {}, data);
try {
  const b = create();
  b.setMode(true);
  b.setTime(600);
  b.startPenalty('home', "2'");
  b.startPenalty('away', "5'");
  assert.equal(b.view().penaltyLimits.home[0], 120000);
  b.run(true);
  now += 30000;
  assert.equal(b.face(now).penalties.home[0], 90);
  b.adjust(-60);
  assert.equal(b.face(now).seconds, 570);
  assert.equal(b.face(now).penalties.home[0], 90, 'Rewinding game clock must not extend penalty');
  b.setTime(900);
  assert.equal(b.face(now).penalties.home[0], 90, 'Setting game clock must not shorten penalty');
  b.penalty('home', 1, 75);
  assert.equal(b.face(now).seconds, 900);
  assert.equal(b.face(now).penalties.home[0], 75);
  assert.equal(b.face(now).penalties.away[0], 270, 'Editing home penalty must not change away penalty');
  for (const seconds of [121, 240, 1200, -1, NaN, Infinity, 1.5]) assert.throws(() => b.penalty('home', 1, seconds));
  b.penalty('home', 1, 120);
  assert.equal(b.face(now).penalties.home[0], 120);
  now += 10000;
  b.run(false);
  now += 60000;
  assert.equal(b.face(now).penalties.home[0], 110, 'Paused game must pause countdown');
  const restored = create(JSON.parse(JSON.stringify(b.toJSON())));
  assert.equal(restored.view().penaltyLimits.home[0], 120000);
  assert.throws(() => restored.penalty('home', 1, 121), 'Cap must survive restart');
  restored.setPeriod('2');
  assert.equal(restored.face(now).penalties.home[0], 110);
  restored.penalty('home', 1, 0);
  assert.equal(restored.view().penaltyLimits.home[0], 0);
  restored.startPenalty('home', "2'+2'");
  assert.equal(restored.face(now).penalties.home[0], 240);
  assert.throws(() => restored.penalty('home', 1, 241));
  restored.penalty('home', 1, 0);
  restored.startPenalty('home', "5'");
  assert.equal(restored.face(now).penalties.home[0], 300);
  assert.throws(() => restored.penalty('home', 1, 301));
  assert.throws(() => restored.penalty('away', 2, 1200), 'Empty slot must respect configured maximum');
  const legacy = create({manual: true, penalties: {home: [90000, 0], away: [230000, 0]}});
  assert.equal(legacy.view().penaltyLimits.home[0], 120000);
  assert.equal(legacy.view().penaltyLimits.away[0], 240000);
  const fields = clockFields(b.face(now), cfg.scoreboard.manual.penaltyColor);
  assert.equal(fields['RectHomePen1.Fill.Color'], '#CD1619FF');
  assert.equal(fields['RectHomePen2.Fill.Color'], '#00000000');
} finally { Date.now = realNow; }

// Exercise the actual editor's rendering, validation and API events with a small
// hook harness. No browser, vMix, network requests or live state writes.
const slots = [];
let cursor = 0;
const sent = [];
const context = {
  _: {useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; }},
  F: {jsx: (type, props, key) => ({type, props, key}), jsxs: (type, props, key) => ({type, props, key})},
  Gc: s => ({penalties: {home: s.penalties.home.map(v => Math.ceil(v / 1000)), away: s.penalties.away.map(v => Math.ceil(v / 1000))}}),
  Uc: s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
  B: async (route, body) => { sent.push({route, body}); return true; },
  P: (...v) => v.filter(Boolean).join(' '), Bc: '', Is: 'input', z: 'button'
};
vm.createContext(context);
const component = fs.readFileSync(path.join(root, 'local-fixes/penalty-editor.js'), 'utf8').replace(/\r\n/g, '\n');
vm.runInContext(component, context);
const props = {side: 'home', name: 'WASA', scoreboard: {penalties: {home: [90000, 60000], away: [0, 0]}, penaltyLimits: {home: [120000, 120000], away: [0, 0]}}, add: ["2'", "2'+2'", "5'"]};
function render() { cursor = 0; return context.Kc(props); }
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)]; }
function find(tree, predicate) { return nodes(tree).find(predicate); }
(async () => {
  let tree = render();
  const input = find(tree, n => n.type === 'input');
  assert.equal(input.props.value, '01:30');
  input.props.onChange({target: {value: '02:01'}});
  tree = render();
  assert.equal(find(tree, n => n.props?.children === 'ZEIT SETZEN').props.disabled, true);
  assert(find(tree, n => n.props?.children === 'Maximal 02:00 erlaubt.'));
  find(tree, n => n.type === 'input').props.onChange({target: {value: '1:15'}});
  tree = render();
  assert.equal(find(tree, n => n.props?.children === 'ZEIT SETZEN').props.disabled, false);
  await find(tree, n => n.props?.children === 'ZEIT SETZEN').props.onClick();
  assert.equal(sent.at(-1).route, 'scoreboard/penalty');
  assert.equal(sent.at(-1).body.seconds, 75);
  assert.equal(sent.at(-1).body.slot, 1);
  tree = render();
  await find(tree, n => n.props?.children === 'AUF 02:00').props.onClick();
  assert.equal(sent.at(-1).body.seconds, 120);
  assert.equal(find(tree, n => n.props?.children === "2'").props.style.backgroundColor, '#CD1619');
  find(tree, n => n.type === 'input').props.onChange({target: {value: '1:99'}});
  tree = render();
  assert.equal(find(tree, n => n.props?.children === 'ZEIT SETZEN').props.disabled, true);
  assert(sent.every(v => v.route === 'scoreboard/penalty'));
  const shipped = fs.readFileSync(path.join(root, 'dist/public/assets/index-C_n3dsHa.js'), 'utf8').replace(/\r\n/g, '\n');
  assert(shipped.includes(component), 'Shipped bundle must contain the tested component');
  // Confirm the rest of the original frontend remains byte-for-byte intact,
  // except the deliberate colour override in the player penalty button.
  const originalPath = path.join(root, 'backup-vor-strafzeit-fix/dist/public/assets/index-C_n3dsHa.js');
  if (fs.existsSync(originalPath)) {
  const original = fs.readFileSync(originalPath, 'utf8').replace(/\r\n/g, '\n');
  const start = original.indexOf('function Kc({side:e,name:t,scoreboard:n,add:r})');
  const end = original.indexOf('function qc(', start);
  const replacementStart = shipped.indexOf(component);
  assert.equal(shipped.slice(0, replacementStart), original.slice(0, start));
  const color = 'className:P(l,tl),style:t===`2\'`?{backgroundColor:`#CD1619`,borderColor:`#CD1619`,color:`#FFFFFF`}:void 0,disabled:!a&&!r';
  assert.equal(shipped.slice(replacementStart + component.length + 1).replace(color, 'className:P(l,tl),disabled:!a&&!r'), original.slice(end));
  }
  console.log('OK: independent game/penalty correction, duration caps, running/paused clocks, persistence, period changes, legacy state, red title fields; editor validation, apply/reset events, red 2-minute button and unchanged surrounding frontend.');
})().catch(e => { console.error(e); process.exitCode = 1; });
