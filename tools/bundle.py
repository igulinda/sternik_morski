"""Buduje jeden samodzielny plik HTML (podgląd / wersja offline) z treścią wbudowaną w stronę.
Użycie: python3 tools/bundle.py [plik_wyjściowy]"""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / 'dist' / 'sternik-morski.html')
idx = json.loads((root / 'content/levels.json').read_text())
content = {'content/levels.json': idx}
for l in idx['levels']:
    if l.get('file'):
        content[l['file']] = json.loads((root / l['file']).read_text())
    if l.get('mc') and (root / l['mc']).exists():
        content[l['mc']] = json.loads((root / l['mc']).read_text())
html = (root / 'index.html').read_text()
body = html[html.index('<body>') + 6: html.index('<script src=')]
css = (root / 'css/style.css').read_text()
js = '\n'.join((root / f).read_text() for f in ['js/visuals.js', 'js/generators.js', 'js/mapa.js', 'js/app.js'])
data = json.dumps(content, ensure_ascii=False).replace('</', '<\\/')
page = f"""<title>Sternik Morski</title>
<meta name="description" content="Fiszki do egzaminu na jachtowego sternika morskiego">
<style>{css}</style>
{body}
<script>window.__CONTENT__ = {data};</script>
<script>{js}</script>
"""
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print(out, round(len(page) / 1024), 'KB')
