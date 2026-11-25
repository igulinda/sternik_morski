# Etap 2 – struktura treści i fiszek

## Pliki
- `content/levels.json` – lista 8 poziomów (ścieżka nauki od podstaw)
- `content/level-N.json` – treść poziomu: lekcje → teoria + fiszki
- `js/visuals.js` – generator grafik SVG (światła, znaki dzienne, IALA, flagi MKS, rytmy świateł, sytuacje)
- `js/app.js`, `index.html`, `css/style.css` – aplikacja

## Lekcja
```json
{ "id": "L2-swiatla", "title": "…", "theory": [ bloki ], "cards": [ fiszki ] }
```
Bloki teorii: `p` (akapit), `ul`/`ol` (lista), `tip` (podpowiedź / mnemotechnika), `table` (`head`, `rows`), `visual` (`visual`, `caption`). W tekście `**pogrubienie**`.

## Fiszka
| Pole | Opis |
|---|---|
| `id` | unikalny identyfikator (postęp nauki jest zapisywany pod tym id) |
| `q` / `qVisual` | pytanie i opcjonalna grafika na awersie |
| `a` / `aVisual` | odpowiedź i opcjonalna grafika na rewersie (domyślnie grafika z pytania) |
| `explain` | wyjaśnienie „dlaczego” |
| `tip` | mnemotechnika |
| `source` | źródło (np. „MPZZ, prawidło 23”) |
| `difficulty` | 1–3 |

## Grafiki (`visual.kind`)
- `lights` – `view`: bow / starboard / port / stern; `vessel`: power / sail; `carries`: mast, mast2, side, stern, anchorF, anchorA, tricolor, rog, tow; `ar`: światła dookoła od góry (np. `["r","w","r"]`); `silhouette`: true pokazuje zarys statku (na odpowiedzi)
- `dayshapes` – `shapes`: ball, cone-up, cone-down, diamond, cylinder, basket
- `buoy` – `type`: port, stbd, pref-port, pref-stbd, card-N/E/S/W, isolated, safe, special, wreck; opcjonalnie `light` (charakterystyka – animacja) i `night`
- `flag` (`letter`) / `flags` (`letters`, `vertical`)
- `rhythm` – `code` (np. `VQ(6)+LFl 10s`, `Fl(2+1) R 10s`, `Iso 4s`, `Mo(A) 6s`), `color`: w/r/g/y – animowane światło
- `situation` – widok z góry: `wind` (skąd wieje, °), `boats`: [{x, y, h (kurs °), type: sail/power/fishing, label, me}]; bom jachtu rysuje się automatycznie po stronie zawietrznej

## Nauka
- Tryb „od podstaw”: poziom → lekcja → teoria → fiszki
- Tryb losowy: wybór poziomów, liczba fiszek, opcja „tylko nieopanowane”; słabe fiszki losowane częściej
- Ocena: Nie wiem (wraca za 3 karty), Prawie (wraca na koniec), Wiem (+1 poziom opanowania, max 3; opanowana od 2)
- Postęp zapisywany w przeglądarce (localStorage)

## Dodane w etapie 3
- `lights.mastV` – liczba świateł masztowych w pionie (holowanie: 2 lub 3)
- `sound` – sygnał dźwiękowy: `seq` z tokenów `S` (krótki), `L` (długi), `B` (dzwon), `G` (gong), `K` (uderzenie w dzwon); przycisk „Odtwórz sygnał” gra go w przeglądarce
