"""Dodaje nowe fiszki i lekcje z plików content/review2/area-*.json do treści aplikacji.

Każdy wpis ma pole "level": newCards → dopisanie do istniejącej lekcji, newLessons → nowa lekcja na końcu poziomu.
Odpowiedzi testowe (pole "mc" w fiszce) trafiają do content/mc/level-N.json.
Użycie: python3 tools/apply_additions.py [--dry-run]
"""
import glob
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
dry = '--dry-run' in sys.argv
levels = {n: json.loads((root / f'content/level-{n}.json').read_text()) for n in range(1, 8)}
mcs = {n: json.loads((root / f'content/mc/level-{n}.json').read_text()) for n in range(1, 8)}
ids = {c['id'] for lv in levels.values() for ls in lv['lessons'] for c in ls['cards']}
lesson_ids = {ls['id'] for lv in levels.values() for ls in lv['lessons']}
stats = {}


def take(card, n):
    card = dict(card)
    m = card.pop('mc', None)
    if not card.get('id') or card['id'] in ids or not str(card.get('q', '')).strip() or not str(card.get('a', '')).strip():
        print(f'  [pominięto] fiszka {card.get("id")}: brak id/treści lub id zajęte')
        return None
    ids.add(card['id'])
    if m and len(m.get('wrong', [])) >= 3 and m.get('correct') and m['correct'] not in m['wrong'][:3]:
        mcs[n]['items'][card['id']] = {'correct': m['correct'], 'wrong': m['wrong'][:3]}
    else:
        print(f'  [uwaga] fiszka {card["id"]}: brak poprawnych odpowiedzi testowych')
    return card


for f in sorted(glob.glob(str(root / 'content/review2/area-*.json'))):
    data = json.loads(pathlib.Path(f).read_text())
    added = lessons_added = 0
    for item in data.get('newCards', []):
        n, lid = item.get('level'), item.get('lesson')
        lv = levels.get(n)
        target = next((ls for ls in lv['lessons'] if ls['id'] == lid), None) if lv else None
        if not target:
            print(f'  [pominięto] {item.get("card", {}).get("id")}: lekcja {lid} nie istnieje na poziomie {n}')
            continue
        c = take(item['card'], n)
        if c:
            target['cards'].append(c)
            added += 1
    for item in data.get('newLessons', []):
        n, ls = item.get('level'), dict(item['lesson'])
        if n not in levels or ls.get('id') in lesson_ids:
            print(f'  [pominięto lekcję] {ls.get("id")}: zły poziom lub id zajęte')
            continue
        ls['cards'] = [c for c in (take(c, n) for c in ls.get('cards', [])) if c]
        lesson_ids.add(ls['id'])
        levels[n]['lessons'].append(ls)
        lessons_added += 1
        added += len(ls['cards'])
    stats[pathlib.Path(f).name] = (added, lessons_added)
    print(f'[{pathlib.Path(f).name}] nowe fiszki: {added}, nowe lekcje: {lessons_added}')

if not dry:
    for n in range(1, 8):
        (root / f'content/level-{n}.json').write_text(json.dumps(levels[n], ensure_ascii=False, indent=1))
        (root / f'content/mc/level-{n}.json').write_text(json.dumps(mcs[n], ensure_ascii=False, indent=1))
print('Razem fiszek:', len(ids))
