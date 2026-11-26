"""Kontrola poprawności treści aplikacji (uruchamiana automatycznie w GitHub Actions).

Sprawdza: poprawność JSON, unikalność identyfikatorów lekcji i fiszek, wymagane pola,
odpowiedzi testowe (3 różne błędne odpowiedzi, różne od poprawnej, bez osieroconych wpisów),
znane rodzaje grafik i generatorów, listę plików w service workerze.
Kończy się kodem 1, gdy znajdzie błąd.
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
errors, warnings = [], []
VISUALS = {'lights', 'dayshapes', 'buoy', 'flag', 'flags', 'rhythm', 'situation', 'sound', 'baric', 'front'}
BLOCKS = {'p', 'ul', 'ol', 'tip', 'table', 'visual'}
gen_src = (root / 'js/generators.js').read_text()
GENS = set(re.findall(r"^    '([a-z-]+)'\(\)", gen_src, re.M))


def load(rel):
    try:
        return json.loads((root / rel).read_text())
    except Exception as e:  # noqa: BLE001
        errors.append(f'{rel}: niepoprawny JSON ({e})')
        return None


def check_visual(v, where):
    if not isinstance(v, dict) or v.get('kind') not in VISUALS:
        errors.append(f'{where}: nieznana grafika {v!r:.80}')


index = load('content/levels.json') or {'levels': []}
lesson_ids, card_ids, total = set(), set(), 0
for lv in index['levels']:
    if not lv.get('file'):
        continue
    data = load(lv['file'])
    if not data:
        continue
    if data.get('level') != lv['level']:
        errors.append(f"{lv['file']}: pole level={data.get('level')} ≠ {lv['level']}")
    level_ids = set()
    for ls in data['lessons']:
        lid = ls.get('id')
        if not lid or lid in lesson_ids:
            errors.append(f'{lv["file"]}: brak lub powtórzony id lekcji {lid}')
        lesson_ids.add(lid)
        if not ls.get('title'):
            errors.append(f'{lid}: brak tytułu')
        for b in ls.get('theory', []):
            if b.get('t') not in BLOCKS:
                errors.append(f'{lid}: nieznany blok teorii {b.get("t")}')
            if b.get('t') == 'visual':
                check_visual(b.get('visual'), lid)
        for c in ls.get('cards', []):
            cid = c.get('id')
            total += 1
            if not cid or cid in card_ids:
                errors.append(f'{lid}: brak lub powtórzony id fiszki {cid}')
            card_ids.add(cid)
            level_ids.add(cid)
            if c.get('gen'):
                if c['gen'] not in GENS:
                    errors.append(f'{cid}: nieznany generator {c["gen"]}')
                continue
            if not str(c.get('q', '')).strip() or not str(c.get('a', '')).strip():
                errors.append(f'{cid}: puste pytanie lub odpowiedź')
            for k in ('qVisual', 'aVisual'):
                if k in c:
                    check_visual(c[k], f'{cid}.{k}')
    if lv.get('mc'):
        mc = load(lv['mc'])
        for k, v in (mc or {}).get('items', {}).items():
            if k not in level_ids:
                errors.append(f'{lv["mc"]}: odpowiedź testowa dla nieistniejącej fiszki {k}')
            w = v.get('wrong', [])
            if not str(v.get('correct', '')).strip() or len(w) < 3 or len(set(w[:3])) < 3 or v.get('correct') in w:
                errors.append(f'{lv["mc"]}: {k} – zła poprawna odpowiedź lub mniej niż 3 różne błędne')

sw = (root / 'sw.js').read_text()
for rel in json.loads(re.search(r'const ASSETS = (\[.*?\]);', sw, re.S).group(1)):
    if rel not in ('./',) and not (root / rel).exists():
        errors.append(f'sw.js: brak pliku {rel} (z listy do pracy offline)')
for lv in index['levels']:
    for k in ('file', 'mc'):
        if lv.get(k) and lv[k] not in sw:
            errors.append(f'sw.js: plik {lv[k]} nie jest na liście do pracy offline')

print(f'Lekcje: {len(lesson_ids)}, fiszki: {total}, generatory: {len(GENS)}')
for w in warnings:
    print('UWAGA:', w)
for e in errors:
    print('BŁĄD:', e)
sys.exit(1 if errors else 0)
