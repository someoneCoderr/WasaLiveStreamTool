// Check the configured port before loading the application (and its state).
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {spawn} = require('node:child_process');

function configuredPort(root, env = process.env) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8').replace(/^\uFEFF/, ''));
  const port = Number(env.PORT ?? cfg.port ?? 8090);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Ungueltiger Panel-Port in config.json oder PORT.');
  return port;
}

async function inspectPort(port) {
  const free = await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
    probe.listen({port, host: '0.0.0.0', exclusive: true}, () => probe.close(error => error ? reject(error) : resolve(true)));
  });
  if (free) return 'free';
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/debug`, {signal: AbortSignal.timeout(2500), redirect: 'error'});
    if (!response.ok) return 'occupied';
    const debug = await response.json();
    const labels = new Set(Array.isArray(debug.status) ? debug.status.map(row => row.label) : []);
    if (Array.isArray(debug.log) && ['vMix', 'Programm', 'Sequenzen'].every(label => labels.has(label))) return 'panel';
  } catch {}
  return 'occupied';
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const port = configuredPort(root);
  const status = await inspectPort(port);
  if (status === 'panel') {
    console.log(`Das vMix Regie Panel laeuft bereits.\nOeffnen: http://localhost:${port}\nKein zweiter Server wurde gestartet.`);
    return;
  }
  if (status === 'occupied') throw new Error(`Port ${port} wird von einem anderen Programm verwendet.\nDas Panel wurde nicht gestartet. Bitte den Portkonflikt beheben. Es wurde kein Prozess beendet.`);
  const child = spawn(process.execPath, [path.join(root, 'dist', 'server.cjs')], {cwd: root, stdio: 'inherit'});
  child.once('error', error => {console.error(`Panel konnte nicht gestartet werden: ${error.message}`); process.exitCode = 1;});
  child.once('exit', (code, signal) => {process.exitCode = code ?? (signal === 'SIGINT' ? 0 : 1);});
}

module.exports = {configuredPort, inspectPort};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
