// Test the shipped graphics code without starting the server or connecting to vMix.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'dist/server.cjs');
const code = fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
const marker = '// server/index.ts\nvar ROOT';
assert.equal(code.split(marker).length, 2);
const isolated = new Module(filename, module);
isolated.filename = filename;
isolated.paths = module.paths;
isolated._compile(code.split(marker)[0] + '\nmodule.exports = { Graphics, loadConfig };', filename);
const cfg = isolated.exports.loadConfig(root);
const gfx = new isolated.exports.Graphics(cfg.graphics, async () => {}, x => x, () => []);
const fixture = duplicate => `[Game]\nTitle=Test\n[Home]\nTeamShort=WASA\n00=Top Home\n4=Other Player\n${duplicate ? '8=Top Home\n' : ''}[Away]\nTeamShort=SVWE\n00=Top Away\n2=Away Player\n`;
gfx.load(fixture(false));
let view = gfx.view('0:0', []);
for (const side of ['home', 'away']) {
  const player = view[side].players.find(p => p.nr === '00');
  assert(player?.top, `Missing selectable topscorer: ${side}`);
  for (const kind of ['goal', 'penalty']) {
    const graphic = gfx.compose({kind, team: side, player: player.nr, value: "2'"}, '1:0', []);
    assert.equal(graphic.text.TxtName, player.name.toUpperCase());
    assert.equal(graphic.visible.ImgTopscorer, true);
    assert.equal(graphic.text.TxtNumber, '');
    assert.equal(graphic.text.TxtEvent, kind === 'goal' ? '1:0' : "2'");
  }
}
gfx.load(fixture(true));
view = gfx.view('0:0', []);
assert.equal(view.home.players.filter(p => p.name === 'Top Home').length, 1);
assert.equal(view.home.players.find(p => p.top).nr, '8');
assert.equal(view.home.players.find(p => p.nr === '4').top, false);
gfx.load('[Game]\n[Home]\n4=Normal Home\n[Away]\n2=Normal Away\n');
assert.equal(gfx.view('0:0', []).home.players.length, 1);
// Check the currently loaded game, too, without modifying the state file.
const stateFile = path.join(root, 'data/state.json');
const saved = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
if (saved.gameConfig) {
  gfx.load(saved.gameConfig);
  for (const side of ['home', 'away']) {
    const team = gfx.team(side);
    if (team.topscorer) assert(gfx.view('0:0', [])[side].players.some(p => p.name === team.topscorer && p.top));
  }
}
console.log('OK: topscorers selectable for both teams; goal and 2-minute penalty keep name and icon; no duplicate or empty entries; current game checked.');
