"""Apply the WASA setup once; preserve the original configuration and state."""
import configparser
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
backup = ROOT / 'backup-vor-wasa'
backup.mkdir(exist_ok=True)
for name in ('config.json', 'data/state.json'):
    target = backup / name
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, target)
c = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
c['port'] = 8090
LIST = '88d4cb51-c609-4f62-9a9a-2e7df9138a54'
MUSIC = '129700d8-5e48-4421-8167-bf41c8977720'
LIDL = 'Presenter - Lidl Schweiz Partner Unihockey Men v2.mp4'
def call(fn, inp=None, **kw):
    return {'Function': fn, **({'Input': inp} if inp else {}), **kw}
def panel(name):
    return {'panel': name}
def step(at, label, calls=None, sub='', required=False):
    d = {'at': at, 'label': label, 'sub': sub}
    if calls:
        d['action'] = {'label': label.upper(), 'auto': False, 'required': required, 'calls': calls}
    return d
def clip(name):
    return [call('LoopOff', name), {'clip': name}]
def stop_ads():
    return [call('Pause', LIST), call('AudioOff', LIST), call('Pause', MUSIC)]
def mute():
    return [panel('audioPause'), call('AudioOff', 'Audio-WirelessMic')]
def game():
    return [call('AudioOff', 'Audio-WirelessMic'), panel('audioGame')]
def ads():
    return [*mute(), panel('overlaysOff'), call('Pause', MUSIC), call('SelectIndex', LIST, Value=1), call('Restart', LIST), call('LoopOn', LIST), call('CutDirect', 'Pausenwerbung WASA'), call('AudioOn', LIST), call('Play', LIST), panel('logosOn'), panel('breakSound')]
def live():
    return [*stop_ads(), call('CutDirect', 'CAM1'), panel('overlaysOn'), panel('logosOn'), *game()]

for camera in c['cams']:
    camera['input'] = {'L': 'CAM2', 'M': 'CAM1', 'R': 'CAM3'}[camera['id']]
c['scoreboard'].pop('bodet', None)
c['scoreboard']['manual'] = {'periodMinutes': 20, 'stopOnGoal': True, 'penaltyColor': '#CD1619FF'}
c['replay'].update(file=r'D:\vMixReplay\1080p50\Replay\replay2.xml', fps=50, seconds=5, highlightMusic=MUSIC, highlightClip={'intro': [], 'outro': []})
c['audio']['sources'] = [
    {'id': 'comm1', 'name': 'Kommentar 1', 'short': 'KOM 1', 'input': 'Audio-COMM1', 'role': 'commentary'},
    {'id': 'comm2', 'name': 'Kommentar 2', 'short': 'KOM 2', 'input': 'Audio-COMM2', 'role': 'commentary'},
    {'id': 'halle', 'name': 'CAM1 · Hallenton (beim Test prüfen)', 'short': 'HALLE', 'input': 'CAM1', 'role': 'atmo'},
]
c['audio']['music'] = {'name': 'WASA Musik', 'input': MUSIC}
c['audio'].update(breakVideo=LIST, breakSound='video')
c['graphics']['logoPath'] = r'C:\_LocalData\230909 Einblender\TeamLogos'
c['graphics']['barColor'] = '#CD1619FF'
ini = configparser.ConfigParser(interpolation=None)
ini.read(r'C:\_LocalApps\TCunihockey\Configurations\system-config_WaSa Männer_261001.txt', encoding='utf-8-sig')
c['sponsor']['list'] = [dict(label=ini[s]['ButtonLabel'], title=ini[s]['Title'], picture=ini[s]['PicturePath']) for s in ini.sections() if s.startswith('Sponsor') and s != 'SponsorAuto' and ini[s].get('PicturePath')]
c['sponsor']['order'] = [1, 2, 3, 4, 5]
# Keep the panel's 8 s + 170 s rotation for the trial, rather than silently importing TC's 10 s + 180 s.
c['sponsor'].update(intervalSec=178, durationSec=8)
c['logosOffFor'] = ['Liga-Trailer lang', 'Liga-Trailer HL.mp4']

c['schedules'] = [
    {'id': 'vorspiel', 'title': 'VOR SPIEL', 'anchorLabel': 'SPIELBEGINN', 'anchorTime': '20:00', 'steps': [
        step('-30:00', 'Stream-Vorbereitung', [*mute(), *stop_ads(), call('CutDirect', 'CAM1'), panel('logosOn')], 'Stream und Aufzeichnung separat starten; beim Probelauf ausgeschaltet lassen.'),
        step('-15:00', 'Opener / Beauty Shot', [call('CutDirect', 'CAM1'), {'gfx': {'kind': 'opener'}}, panel('logosOn')], 'Hub-Veröffentlichung separat prüfen.'),
        step('-14:30', 'WASA-Werbeslot 1', ads(), 'WASA-Videoliste im Liga-Hintergrund; nächste Aktion beendet den Slot.'),
        step('-08:30', 'Zurück zum Opener', [*stop_ads(), call('CutDirect', 'CAM1'), panel('overlaysOn'), {'gfx': {'kind': 'opener'}}]),
        step('-08:00', 'Liga-Trailer und Kommentar', [*mute(), *stop_ads(), {'gfx': 'hide'}, *clip('Liga-Trailer lang'), call('CutDirect', 'CAM1'), panel('logosOn'), *game()], 'Trailer läuft vollständig; danach CAM1 und beide Kommentare.'),
        step('-07:00', 'Aufstellungen Gast und Heim', [call('CutDirect', 'CAM1'), *game(), {'gfx': {'kind': 'lineup', 'team': 'away'}}, {'wait': 30000}, {'gfx': 'hide'}, {'wait': 3000}, {'gfx': {'kind': 'lineup', 'team': 'home'}}, {'wait': 30000}, {'gfx': 'hide'}], 'Zuerst die aktuelle Spiel-Konfiguration laden.'),
        step('-05:00', 'Einlauf, Schiedsrichter, Starting 6', sub='Kameras und Einblender von Hand passend zum Hallenablauf wählen.'),
        step('-00:22', 'Mobiliar vor dem Bully', [*mute(), *stop_ads(), {'gfx': 'hide'}, *clip('Mobiliar-Werbung'), *live()], 'Von Hand auslösen; danach CAM1 mit Kommentar und Hallenton.', True),
        step('-00:10', 'Live-Bild kontrollieren', sub='CAM1, Kommentar, Hallenton, Logos und Matchuhr prüfen.'),
        step('00:00', '1. Drittel', sub='Matchuhr im Modus VON HAND starten.'),
    ]},
    {'id': 'pause', 'title': 'PAUSE', 'anchorLabel': 'WIEDERANPFIFF',
     'start': {'label': 'PAUSE STARTEN', 'sub': 'Resultat 15 s · Drittel-Replays · WASA-Werbung', 'note': '15 Minuten. Lidl mit ZURÜCK ZUM SPIEL von Hand auslösen.', 'minutes': 15,
               'calls': [call('CutDirect', 'CAM1'), {'gfx': {'kind': 'result'}}, {'wait': 15000}, {'gfx': 'hide'}, *mute(), panel('overlaysOff'), panel('periodClip'), *ads()]},
     'end': {'label': 'ZURÜCK ZUM SPIEL', 'sub': 'WASA-Werbung aus · Lidl Men · CAM1 mit Ton', 'calls': [*mute(), *stop_ads(), *clip(LIDL), *live()]},
     'steps': [step('-15:00', 'Pausenbeginn', sub='Startknopf: Resultat, Drittel-Replays, danach WASA-Werbeliste.'), step('-01:00', 'Lidl vorbereiten', sub='ZURÜCK ZUM SPIEL von Hand so auslösen, dass Lidl rechtzeitig vor dem Bully endet. Zeitpunkt mit Verantwortlichen klären.'), step('00:00', 'Wiederanpfiff', sub='Live-Bild, Ton und Matchuhr von Hand kontrollieren.')]},
]
c['preGame']['onStreamStart'] = [*mute(), *stop_ads(), call('CutDirect', 'CAM1'), panel('logosOn')]
c['preGame']['reminder'] = 'WASA-Test: zuerst PROBELAUF ohne Stream. Spielbeginn setzen, aktuelle Spiel-Config laden, Matchuhr auf VON HAND. Alle Rundown-Aktionen werden zunächst von Hand ausgelöst.'
c['preGame'].pop('emergency', None)
for item in c['preGame']['checklist']:
    if item['id'] == 'audio': item['sub'] = 'Audio-COMM1 und Audio-COMM2 einzeln prüfen; Funkmikrofon nur gezielt in vMix einschalten.'
    if item['id'] == 'replay': item['sub'] = 'Testregister 11–14 und Highlights 10 prüfen; alte Register 1–8 bleiben getrennt. Panel löscht keine vMix-Events.'
    if item['id'] == 'clock': item['sub'] = 'L-UPL Men, im Panel VON HAND wählen; Uhr stoppt bei Tor.'
    if item['id'] == 'level': item['sub'] = 'CAM1-Hallenton und Musikpegel prüfen; echtes Loudness-Meter verwenden.'
    if item['id'] == 'backup': item['sub'] = 'Vereins-Backup und zuständige Person vor Ort klären.'
    if item['id'] == 'rec': item['sub'] = 'Aufnahmeformat und Speicherplatz in vMix prüfen; Panel ändert keine Encoder-Einstellungen.'
for item in c['controlling']:
    if item.get('input') == 'Intro L-UPL.mp4': item['input'] = 'Liga-Trailer lang'
    if item.get('input') == 'mob_jubel_web_D.mp4': item['input'] = 'Mobiliar-Werbung'
    if 'Women' in item.get('input', ''): item['input'] = LIDL
c['postGame']['finish'] = {'label': 'ABSCHLUSS NACH BEST PLAYER', 'sub': 'Erst Ehrungen und Kommentar beenden, dann: Highlights · kurzer Liga-Trailer · 15 s CAM1 · Stream-Stopp', 'calls': [*mute(), *stop_ads(), {'gfx': 'hide'}, panel('overlaysOff'), panel('highlightClip'), *clip('Liga-Trailer HL.mp4'), call('CutDirect', 'CAM1'), panel('logosOn'), {'wait': 15000}, panel('stopAll')]}
c['postGame']['highlightVideo']['template'] = [
    {'title': 'Liga-Intro kurz', 'input': 'Liga-Trailer HL.mp4'},
    {'title': 'Mobiliar', 'input': 'Mobiliar-Werbung', 'required': True},
    {'highlights': True},
    {'title': 'Lidl Men', 'input': LIDL, 'required': True},
]
(ROOT / 'config.json').write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('WASA config written; originals in', backup)
