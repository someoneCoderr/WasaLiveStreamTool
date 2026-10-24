// Read-only config checks and sequence rehearsal with a fake vMix client.
// The production server entry point is deliberately excluded: no HTTP or vMix connection.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const bundlePath = path.join(root, 'dist/server.cjs');
const bundle = fs.readFileSync(bundlePath, 'utf8').replace(/\r\n/g, '\n');
const marker = '// server/index.ts\nvar ROOT';
assert.equal(bundle.split(marker).length, 2, 'Expected one server entry point');
const isolated = new Module(bundlePath, module);
isolated.filename = bundlePath;
isolated.paths = module.paths;
isolated._compile(bundle.split(marker)[0] + '\nmodule.exports = { loadConfig, Panel };', bundlePath);
const cfg = isolated.exports.loadConfig(root);
const xml = fs.readFileSync('C:/_vMix/Projects/vMix-Preset-Men-260925.vmix', 'utf8');
const decode = s => s.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const inputs = [...xml.matchAll(/<Input\b([^>]+)>([\s\S]*?)<\/Input>/g)].map((m, i) => {
  const a = Object.fromEntries([...m[1].matchAll(/([\w]+)="([^"]*)"/g)].map(v => [v[1], decode(v[2])]));
  return { key: a.Key, title: a.Title || a.OriginalTitle, number: i + 1, type: a.Type === '14' ? 'VideoList' : a.Type === '0' ? 'Video' : a.Type === '3000' ? 'Replay' : 'Other', state: 'Paused', duration: 12000, position: 0, fields: {}, colors: [], layers: [a.Overlay0, a.Overlay1].filter(Boolean), replay: a.Type === '3000' ? {recording: 'True'} : null, muted: true, meter: 0, attributes: a, filename: decode(m[2].trim()) };
});
assert.equal(inputs.length, 32);
const refs = [];
function walk(value, at = '') {
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${at}[${i}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, v] of Object.entries(value)) {
    if (['input', 'Input', 'clip', 'highlightMusic', 'breakVideo'].includes(key) && v) refs.push([`${at}.${key}`, v]);
    if (['inputs', 'logosOffFor', 'intro', 'outro'].includes(key) && Array.isArray(v)) v.forEach(x => typeof x === 'string' && refs.push([at + '.' + key, x]));
    walk(v, at + '.' + key);
  }
}
walk(cfg);
for (const [at, ref] of refs) assert(inputs.some(i => i.key === ref || i.title === ref || (ref.endsWith('*') && i.title.startsWith(ref.slice(0, -1)))), `${at}: missing input ${ref}`);
assert(fs.existsSync(cfg.replay.file));
assert(fs.existsSync(path.join(cfg.graphics.logoPath, 'WASA.png')));
cfg.sponsor.list.forEach(s => assert(fs.existsSync(s.picture), s.picture));
const ads = inputs.find(i => i.key === cfg.audio.breakVideo);
const adFiles = ads.attributes.Videos.split(/\r?\n/).filter(Boolean).map(line => line.split('|')[0]);
assert.equal(adFiles.length, 5, 'Expected all five WASA advertising clips');
adFiles.forEach(file => assert(fs.existsSync(file), file));
const media = new Set(refs.map(([, r]) => inputs.find(i => i.key === r || i.title === r)).filter(Boolean));
for (const i of media) if (i.filename) assert(fs.existsSync(i.filename), i.filename);
assert(!cfg.scoreboard.bodet);
assert.equal(cfg.scoreboard.manual.stopOnGoal, true);
assert.equal(cfg.schedules[1].start.minutes, 15);
assert(cfg.schedules.every(s => s.steps.every(t => !t.action?.auto)));
assert(!JSON.stringify(cfg).match(/Women|Riders|UR44C|General Music|tcunihockey_files|Users\\\\livestream/));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'wasa-rehearsal-'));
const sent = [];
const fake = { call: async c => sent.push(c) };
const panel = new isolated.exports.Panel(cfg, fake, scratch);
panel.vm = {version: 'test', inputs, overlays: {}, active: 1, preview: 2, streaming: false, recording: false, masterMeter: 0};
panel.gfx.load(fs.readFileSync('C:/Users/uhcwa/Downloads/game-config_110222.txt', 'utf8'));
assert.deepEqual(panel.warnings(), []);
// Exercise real sequence dispatch and input GUID resolution, skipping only time and media playback.
panel.showGraphic = async request => sent.push({gfx: request});
panel.playClip = async input => sent.push({clip: input});
panel.clip = async tab => sent.push({reelTab: tab});
async function rehearsal(calls) {
  sent.length = 0;
  await panel.run(calls.filter(c => !('wait' in c) || 'clip' in c));
  return [...sent];
}
(async () => {
  const trailer = await rehearsal(cfg.schedules[0].steps.find(s => s.at === '-08:00').action.calls);
  assert(trailer.some(c => c.clip === 'Liga-Trailer lang'));
  for (const title of ['Audio-COMM1', 'Audio-COMM2', 'CAM1']) assert(trailer.some(c => c.Function === 'AudioOn' && c.Input === inputs.find(i => i.title === title).key));
  const pause = await rehearsal(cfg.schedules[1].start.calls);
  assert(pause.some(c => c.Function === 'Play' && c.Input === cfg.audio.breakVideo));
  assert(pause.some(c => c.Function === 'CutDirect' && c.Input === inputs.find(i => i.title === 'Pausenwerbung WASA').key));
  const back = await rehearsal(cfg.schedules[1].end.calls);
  assert(back.some(c => c.clip === 'Presenter - Lidl Schweiz Partner Unihockey Men v2.mp4'));
  assert(back.some(c => c.Function === 'Pause' && c.Input === cfg.audio.breakVideo));
  assert(!back.some(c => c.Function === 'AudioOn' && c.Input === inputs.find(i => i.title === 'Audio-WirelessMic').key));
  panel.vm.streaming = true;
  panel.vm.recording = true;
  const finish = await rehearsal(cfg.postGame.finish.calls);
  assert(finish.some(c => c.clip === 'Liga-Trailer HL.mp4'));
  for (const fn of ['StopStreaming', 'StopRecording', 'ReplayStopRecording']) assert(finish.some(c => c.Function === fn));
  console.log(`OK: production schema, ${refs.length} input references, ${cfg.sponsor.list.length} sponsor images, ${adFiles.length} advertising files; 4 sequence rehearsals with fake vMix. No real server, stream or recording started.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
