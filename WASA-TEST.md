# WASA: erster Test mit vMix

Die Config ist für das gespeicherte Männer-Preset vom 25.09.2026 vorbereitet.
Originale: `backup-vor-wasa/config.json` und `backup-vor-wasa/data/state.json`.
Das ursprüngliche vMix-Preset, TC-Dateien, Medien und bestehende Replay-Dateien wurden nicht verändert.

## Start

1. In vMix `C:\_vMix\Projects\vMix-Preset-Men-260925.vmix` öffnen. Record und Stream zunächst ausgeschaltet lassen.
2. In Settings > Web Controller Port 8088 aktivieren. Das Panel läuft auf demselben Laptop und verwendet 127.0.0.1.
3. TC Unihockey für diesen Test schliessen: Einblender und Uhr durch das Panel bedienen.
4. `start.bat` in diesem Ordner öffnen, dann http://localhost:8090 im Browser. Port 8090 muss für das Panel frei sein. Die Verbindung zur vMix-API bleibt auf Port 8088.
5. Im Panel den richtigen Spielbeginn einstellen. Aktuelle Spiel-Konfiguration vom Generator im Tab EINBLENDER laden. Vorhandene `game-config_110222.txt` in Downloads ist nur ein altes Beispielspiel, keine aktuelle Aufstellung.
6. Matchuhr auf **VON HAND** umschalten. Keine Bodet-Verbindung ist eingerichtet. Die Uhr läuft manuell und stoppt bei einem über das Panel gezählten Tor.

## Gezielt testen

- Kameras: L = CAM2, M = CAM1, R = CAM3. Erst Preview, dann Live prüfen.
- Kommentar 1 und 2 einzeln prüfen. CAM1 ist vorläufig als Hallenton zugeordnet; die tatsächliche Atmoquelle vor Ort abhören. Pegel werden nicht verändert. Musik war im gespeicherten Preset sehr leise: in vMix abhören und einstellen.
- Funkmikrofon bleibt in den vorbereiteten Abläufen aus; für Interviews gezielt in vMix einschalten und anschliessend wieder ausschalten. Es wird vom normalen SPIEL-Tonknopf nicht eingeschaltet.
- Opener, Aufstellungen, Tor, Strafe, Uhr, Sponsoren und Liga-Logos testen. Die Sponsor-Liste ist bereits eingetragen; automatischen Wechsel im Panel einschalten, wenn gewünscht.
- Sponsoren: fünf WASA-Logos, 8 s Anzeige und 170 s Pause (178 s von Start zu Start). Import der alten TC-Systemdatei würde diese Liste und Zeiten überschreiben (dort 10 s + 180 s). Für diesen Test ist kein Systemdatei-Import nötig.
- PROBELAUF vor dem Spiel und in der Pause ausführen. Er schaltet wirklich das vMix-Programmbild, startet aber keinen Stream. Trailer/Mobiliar/Lidl vollständig und mit Ton kontrollieren. Bei diesen Video-Inputs ist im gespeicherten Preset Audio-Follow aktiv; das muss auch im geladenen Projekt stimmen.
- Pausenbild: `Pausenwerbung WASA` enthält den Liga-Hintergrund und die vorhandene Videoliste mit Medbase, Berit, Rosenberg, Zubi und Migros. Prüfen, dass mehrere Clips nacheinander laufen, der Ton ankommt und die Logos sichtbar bleiben.
- Sponsor-Automatik: eingeschaltet lassen, Pause starten und prüfen, dass keine Sponsor-Einblendung kommt (auch beim Resultat auf Kamerabild). Sie bleibt auch auf der Werbeliste und während der Rückkehr ausgesetzt. Danach läuft das volle Intervall bis zum nächsten Sponsor; keine sofortige Nachholung.
- Pause: 15 Minuten. Start zeigt das Resultat 15 s, spielt vorhandene Panel-Drittelszenen und startet die Werbeliste. ZURÜCK ZUM SPIEL stoppt die Liste, spielt Lidl Men und schaltet auf CAM1 mit Ton zurück.
- Alle Rundown-Aktionen sind zunächst manuell (kein `auto: true`). PROBELAUF führt sie trotzdem der Reihe nach aus. Für einen späteren Spielbetrieb Automatik und exakte Werbezeiten gemeinsam festlegen.

## Replays und Highlights

### Strafzeiten korrigieren

Im Modus VON HAND hat jeder Strafplatz ein eigenes Restzeit-Feld (M:SS), ZEIT SETZEN und einen Rücksetzknopf, z. B. AUF 02:00. Damit wird nur diese Strafe geändert; Spieluhr und andere Strafen bleiben unverändert. Umgekehrt ändern die Spielzeit-Korrekturen (+/- Sekunden oder Zeit setzen) die Reststrafen nicht mehr. Start/Stopp des Countdowns bleibt an den Lauf der Spieluhr gekoppelt.

Neue Strafen behalten ihre ursprüngliche Höchstdauer, auch nach einem Panel-Neustart. Eingaben über dieser Dauer werden abgelehnt (2 Minuten: maximal 02:00). Bei alten gespeicherten Strafen ohne Dauerangabe wird einmalig die kleinste passende konfigurierte Strafdauer aus der gespeicherten Restzeit abgeleitet; die ursprüngliche Dauer lässt sich aus alten Daten nicht immer eindeutig rekonstruieren. Bei unplausiblen Altwerten den Strafplatz löschen und die richtige Strafart neu anlegen.

Die Strafzeit-Kästchen in vMix und die 2-Minuten-Knöpfe im Panel sind rot. Nach dieser Änderung das Panel neu starten und die Browserseite neu laden. Die Tests unter `node tools/check-penalties.cjs` prüfen Korrekturen, Grenzen und die Eingabefelder ohne Verbindung zu vMix.

Für Replay-Markierungen die Replay-Aufnahme in vMix separat starten. Das braucht keinen Stream.
Vor Spielbeginn je eine frische Szene mit M, L und R in der Panel-Vorschau prüfen. M entspricht CAM1 / Replay-Kamera 1. Eine fehlende Aufnahme einer einzelnen Kamera wird durch die korrekte Auswahl nicht ersetzt: Bei schwarzen älteren Szenen die Aufnahmeabdeckung der Kamera im betroffenen Zeitraum prüfen. Ein späterer funktionsfähiger Replay beweist keine lückenlose frühere Aufnahme.
Testablage: Drittel 1/2/3 und Verlängerung in **11/12/13/14**, Highlights in **10**.
Die bisherigen Register 1–8 werden nicht gelöscht oder umsortiert. Vor dem Test prüfen, dass die Testregister leer sind. Neue Testereignisse nur durch das Panel anlegen und bearbeiten.
Der Import aus vMix liest `D:\vMixReplay\1080p50\Replay\replay2.xml`; er übernimmt die konfigurierten Register, nicht automatisch die bisherige Torablage 8.
Nach dem Test die erzeugten Ereignisse in den Testregistern in vMix entfernen und im Panel NEUES SPIEL ausführen. NEUES SPIEL allein löscht keine vMix-Ereignisse.

Highlight-Aufnahme: kurzer Liga-Trailer, Mobiliar, Highlights mit vorhandener WASA-Musik, Lidl Men. Dieser Knopf startet tatsächlich eine lokale Aufnahme. Vorher Stream und andere Aufnahme stoppen, Funkmikrofon ausschalten und Ton/Pegel prüfen. Einzelne Tore weiterhin separat in vMix exportieren; Hub-Uploads bleiben manuell.
Der Abschlussknopf stoppt Stream und Aufnahmen nach Highlights, kurzem Liga-Trailer und 15 s CAM1. Ihn erst nach Best-Player-Ehrung und Kommentarende verwenden. Die maximale Länge der Live-Highlights wird nicht automatisch auf eine Minute begrenzt.

## Noch vor dem ersten echten Spiel klären

- Tatsächliche Hallentonquelle und beide Kommentatoren, Musiklautstärke, Stereo und echtes Loudness-Meter.
- Die PDF nennt für Lidl unterschiedliche Zeitpunkte. Deshalb von Hand auslösen; mit der Regieverantwortlichen den verbindlichen Zeitpunkt festlegen.
- Overlay-Kanäle der Config: Uhr 1, Einblender 2, Sponsoren 3, Liga-Logos 4. Sichtbar und ohne Konflikte prüfen.
- Stream-Key, Hub-Empfang, Encoder und Aufnahmeziel weiter in vMix kontrollieren. Diese wurden nicht geändert. Aus der Config allein folgt keine Freigabe für den Spielbetrieb.

## Prüfung und Rückkehr

`node tools/check-wasa.cjs` prüft die Config mit dem originalen Anwendungsschema, Inputnamen, Medienpfade und simulierten Abläufen. Es verbindet sich nicht mit vMix. Zeitabläufe, tatsächliches Bild und Ton werden damit nicht geprüft.

Zur Rückkehr Panel beenden, `backup-vor-wasa/config.json` zurück nach `config.json` kopieren und `start.bat` neu starten. Bei Bedarf auch den gesicherten Panel-Zustand zurückkopieren. Das bisherige vMix-Preset und TC bleiben verfügbar.
