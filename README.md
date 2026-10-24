# WASA LiveStream Tool

Für WASA St. Gallen angepasstes Regiepanel. Grundlage: [FB-Riders/vmix-control](https://github.com/FB-Riders/vmix-control), MIT-Lizenz, siehe LICENSE.

Dieses Repository enthält die angepasste, startfertige Distribution in `dist/`, die WASA-Config sowie lokale Korrekturen und Prüfskripte. Der vollständige ursprüngliche React-/TypeScript-Quellbaum war im lokalen Release-Paket nicht enthalten; er ist im verlinkten Ursprungsprojekt verfügbar. Updates der Distribution müssen mit den lokalen Korrekturen abgeglichen werden.

## WASA: Start und Test

Node.js LTS installieren, WASA-Preset in vMix öffnen, Web Controller auf Port 8088 aktivieren, `start.bat` starten. Panel: http://localhost:8090 (Port muss frei sein). Kein Installations- oder Build-Schritt nötig. Aktuelle Spiel-Konfiguration im Panel laden und Uhr auf VON HAND stellen.

Die Config verwendet die vorhandenen Medienpfade des Regie-Laptops. Kameras: Mitte CAM1, links CAM2, rechts CAM3. Replay-Register 11–14 und Highlights 10; 15-Minuten-Pause; beide Kommentatoren und WASA-Werbeliste. Topscorer-Auswahl korrigiert, Grafikbalken und Strafanzeigen rot. Strafzeit-Korrekturen sind von Spielzeit-Korrekturen getrennt und auf die ursprüngliche Dauer begrenzt. Eine g+m-Hallenuhr ist noch nicht angebunden.

Details: [WASA-TEST.md](WASA-TEST.md).

Prüfungen ohne vMix-Verbindung:

```text
node --check dist/server.cjs
node tools/check-topscorer.cjs
node tools/check-penalties.cjs
node tools/check-sponsor-pause.cjs
```

`node tools/check-wasa.cjs` prüft zusätzlich das lokale WASA-Preset und die Medienpfade mit simuliertem vMix; dieser Test benötigt die vorhandenen Dateien auf dem Regie-Laptop.
Der lokale Strafzeit-Editor liegt lesbar in `local-fixes/penalty-editor.js`; `tools/apply-penalty-editor.py` setzt ihn in das Frontend ein. `tools/configure-wasa.py` ist ein einmaliges Einrichtungsskript und überschreibt die Config mit den dort definierten Werten; im Normalbetrieb direkt `config.json` bearbeiten.

Die Sponsor-Automatik setzt während einer gestarteten Pause, auf dem WASA-Pausenbild und während Replay-/Rückkehrsequenzen aus. Nachher beginnt ein volles Sponsor-Intervall, ohne sofort eine verpasste Einblendung nachzuholen. Der Automatik-Schalter bleibt eingeschaltet.

Replay Mitte wird mit CAM1 / Replay-Kamera 1 bedient und wurde über die Panel-Vorschau mit einer vorhandenen Aufnahme geprüft. Schwarze Bilder können auch durch Aufnahmelücken einzelner Kameras entstehen; korrekte Kameraauswahl allein garantiert keine vorhandenen Bilder. Einen Probereplay je Kamera vor Spielbeginn kontrollieren.

Laufzeitdaten (`data/`), Sicherungen (`backup-*/`), Spielkonfigurationen, Medien und Aufnahmen sind vom Git-Upload ausgeschlossen. Das Panel legt seinen Zustand selbst an. Vorhandene Sicherungen bleiben lokal erhalten. Stream-Schlüssel werden nur in vMix gepflegt.

## Ursprüngliche Projektanleitung

The panel controls vMix for a floorball livestream. It runs on the vMix computer. Phones in the same network open it in a browser.

The panel does these tasks:

- It runs the pre-game sequence of the swiss unihockey livestream rules (clips, line-ups, logos).
- It marks replays and makes the highlight video.
- It shows the match clock from the Bodet Scorepad or by hand.
- It shows the on-screen graphics. It replaces TC Unihockey.
- It monitors the stream for the controlling (audio, loudness, logos, clips).

## Install

You need a Windows computer with vMix and [Node.js](https://nodejs.org) LTS.

1. In vMix, open **Settings → Web Controller**. Enable it on port `8088`.
2. Download `vmix-regie-panel.zip` from the [latest release](https://github.com/FB-Riders/vmix-control/releases/latest).
3. Unzip the file, for example to the desktop.
4. Double-click `start.bat`.
5. Read the address in the window, for example `http://192.168.1.20:8090`.
6. Open this address on a phone or on the vMix computer.

If Windows asks about the firewall, allow Node.js for private networks.

## Build from the source code

You also need [Git](https://git-scm.com). Enter these commands in a terminal:

```
git clone https://github.com/FB-Riders/vmix-control.git
cd vmix-control
corepack enable
pnpm install
pnpm build
```

Then double-click `start.bat`.

## Try it without vMix

Enter these commands in three terminals:

```
pnpm mock    # simulates vMix on port 8088
pnpm bodet   # simulates the Scorepad on port 4001
VMIX_HOST=127.0.0.1 pnpm dev
```

On Windows PowerShell, use this command for the third terminal: `$env:VMIX_HOST="127.0.0.1"; pnpm dev`.

Then open `http://localhost:5173`.

## Adapt it to your club

1. Open `config.json`.
2. Set `vmix.host` to the address of the vMix computer. Use `127.0.0.1` if the panel runs on the vMix computer.
3. Change the input names to the names in your vMix project.
4. Change the clips, sponsors and sequences for your league.
5. Start `start.bat` again.

When the panel starts, it shows the input names that vMix does not know.

For all settings and functions, refer to [docs/reference.md](docs/reference.md).

## License

MIT. Refer to [LICENSE](LICENSE). There is no warranty.
