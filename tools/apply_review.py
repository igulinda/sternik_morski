"""Wprowadza wyniki weryfikacji z podręcznikiem (content/review/level-N.json) do treści.

- fixes: podmienia fragment tekstu w fiszce (a/q/explain/tip) lub w teorii lekcji,
  a gdy zmienia się poprawna odpowiedź – aktualizuje odpowiedź w content/mc/level-N.json
- newCards: dopisuje fiszki do istniejących lekcji (+ odpowiedzi testowe do mc)
- newLessons: dopisuje nowe lekcje na końcu poziomu (+ odpowiedzi testowe do mc)

Użycie: python3 tools/apply_review.py [--dry-run] [poziomy...]
Wypisuje raport: co wprowadzono, co pominięto i dlaczego.
"""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
dry = '--dry-run' in sys.argv
levels = [int(a) for a in sys.argv[1:] if a.isdigit()] or list(range(1, 8))
CARD_FIELDS = ('q', 'a', 'explain', 'tip')


def load(p, default=None):
    p = root / p
    return json.loads(p.read_text()) if p.exists() else default


def save(p, data):
    if not dry:
        (root / p).write_text(json.dumps(data, ensure_ascii=False, indent=1))


def replace_in_theory(lesson, old, new):
    """Podmienia fragment w blokach teorii (p, tip, ul/ol, table, caption)."""
    for b in lesson.get('theory', []):
        for key in ('text', 'caption'):
            if isinstance(b.get(key), str) and old in b[key]:
                b[key] = b[key].replace(old, new, 1)
                return True
        for key in ('items',):
            for i, it in enumerate(b.get(key, [])):
                if old in it:
                    b[key][i] = it.replace(old, new, 1)
                    return True
        for row in b.get('rows', []) + [b.get('head', [])]:
            for i, cell in enumerate(row):
                if isinstance(cell, str) and old in cell:
                    row[i] = cell.replace(old, new, 1)
                    return True
    return False


all_ids = set()
for n in range(1, 8):
    d = load(f'content/level-{n}.json', {'lessons': []})
    for ls in d['lessons']:
        all_ids.update(c['id'] for c in ls['cards'])

for n in levels:
    rev = load(f'content/review/level-{n}.json')
    if not rev:
        print(f'[poziom {n}] brak raportu – pomijam')
        continue
    lv = load(f'content/level-{n}.json')
    mc = load(f'content/mc/level-{n}.json', {'level': n, 'items': {}})
    lessons = {ls['id']: ls for ls in lv['lessons']}
    cards = {c['id']: (ls, c) for ls in lv['lessons'] for c in ls['cards']}
    ok = skipped = 0
    for f in rev.get('fixes', []):
        fid, where, old, new = f.get('id'), f.get('where'), f.get('old', ''), f.get('new', '')
        done = False
        if where in CARD_FIELDS and fid in cards:
            c = cards[fid][1]
            if isinstance(c.get(where), str) and old and old in c[where]:
                c[where] = c[where].replace(old, new, 1)
                done = True
            elif where in ('explain', 'tip') and not c.get(where) and not old:
                c[where] = new
                done = True
            if done and f.get('mc_correct') and fid in mc['items']:
                mc['items'][fid]['correct'] = f['mc_correct']
        elif where == 'theory':
            ls = lessons.get(fid) or (cards[fid][0] if fid in cards else None)
            if ls and old:
                done = replace_in_theory(ls, old, new)
        if done:
            ok += 1
        else:
            skipped += 1
            print(f'  [pominięto] {fid} ({where}): nie znaleziono fragmentu „{old[:60]}”')
    added = 0
    for item in rev.get('newCards', []):
        c, lid = dict(item['card']), item.get('lesson')
        if lid not in lessons or c.get('id') in all_ids:
            print(f'  [pominięto nową fiszkę] {c.get("id")}: lekcja {lid} nie istnieje lub id zajęte')
            continue
        m = c.pop('mc', None)
        lessons[lid]['cards'].append(c)
        all_ids.add(c['id'])
        if m and len(m.get('wrong', [])) >= 3:
            mc['items'][c['id']] = {'correct': m['correct'], 'wrong': m['wrong'][:3]}
        added += 1
    newl = 0
    for item in rev.get('newLessons', []):
        ls = item['lesson']
        if ls['id'] in lessons:
            print(f'  [pominięto lekcję] {ls["id"]}: id zajęte')
            continue
        clean = []
        for c in ls['cards']:
            if c.get('id') in all_ids:
                print(f'  [pominięto fiszkę w nowej lekcji] {c.get("id")}: id zajęte')
                continue
            c = dict(c)
            m = c.pop('mc', None)
            if m and len(m.get('wrong', [])) >= 3:
                mc['items'][c['id']] = {'correct': m['correct'], 'wrong': m['wrong'][:3]}
            all_ids.add(c['id'])
            clean.append(c)
        ls['cards'] = clean
        lv['lessons'].append(ls)
        lessons[ls['id']] = ls
        newl += 1
        added += len(clean)
    save(f'content/level-{n}.json', lv)
    save(f'content/mc/level-{n}.json', mc)
    print(f'[poziom {n}] poprawki: {ok} (pominięte {skipped}), nowe fiszki: {added}, nowe lekcje: {newl}')
