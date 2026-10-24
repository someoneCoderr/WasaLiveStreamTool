"""Insert the readable local component into the release bundle; no dependencies needed."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
bundle = root / 'dist/public/assets/index-C_n3dsHa.js'
text = bundle.read_text(encoding='utf-8')
start = text.index('function Kc({side:e,name:t,scoreboard:n,add:r})') if 'function Kc({side:e,name:t,scoreboard:n,add:r})' in text else text.index('// Local replacement for the shipped Kc penalty controls.')
end = text.index('function qc(', start)
replacement = (root / 'local-fixes/penalty-editor.js').read_text(encoding='utf-8')
text = text[:start] + replacement + '\n' + text[end:]
old = 'className:P(l,tl),disabled:!a&&!r'
new = 'className:P(l,tl),style:t===`2\'`?{backgroundColor:`#CD1619`,borderColor:`#CD1619`,color:`#FFFFFF`}:void 0,disabled:!a&&!r'
if old in text:
    assert text.count(old) == 1
    text = text.replace(old, new)
else:
    assert new in text
bundle.write_text(text, encoding='utf-8')
html = root / 'dist/public/index.html'
page = html.read_text(encoding='utf-8')
page = page.replace('/assets/index-C_n3dsHa.js"', '/assets/index-C_n3dsHa.js?v=wasa-penalties-1"')
html.write_text(page, encoding='utf-8')
print('Penalty editor inserted; frontend cache version updated.')
