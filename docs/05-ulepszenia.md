# Ulepszenia (po etapie 8)

1. **Podtrzymanie bazy** – `.github/workflows/podtrzymanie-bazy.yml` co 3 dni wywołuje funkcję `ping()` w Supabase (darmowy projekt jest usypiany po tygodniu bez aktywności). Można też uruchomić ręcznie: GitHub → Actions → „Podtrzymanie bazy Supabase” → Run workflow.
2. **Powtórki rozłożone w czasie** – każda fiszka ma termin powtórki (`due_at`) i odstęp (`ivl`): „Wiem” → 1, 3, 8, 20, 50… dni (×2,5, maks. 120), „Prawie” → jutro, „Nie wiem” → jeszcze dziś. Ekran startowy pokazuje „Powtórki na dziś” (`#powtorki`, do 50 fiszek na sesję).
3. **Aplikacja na telefonie / offline** – `manifest.webmanifest`, ikony w `icons/`, `sw.js` (service worker): pliki i treść z pamięci telefonu, aktualizacja w tle; postęp bez internetu czeka w kolejce i wysyła się po odzyskaniu połączenia; zalogowana osoba pozostaje zalogowana offline.
   - iPhone (Safari): Udostępnij → „Do ekranu początk.”; Android (Chrome): menu ⋮ → „Zainstaluj aplikację” / „Dodaj do ekranu głównego”.
4. **Automatyczna kontrola treści** – `.github/workflows/kontrola-tresci.yml` przy każdej zmianie uruchamia `tools/validate.py` (JSON, unikalne id, odpowiedzi testowe, grafiki, lista plików offline) i `tools/validate_generators.js`.
5. **Postęp rodziny** – ekran „Rodzina” (`#rodzina`): opanowane / w trakcie, ostatnia nauka, sesje w 7 dni, egzaminy próbne. Dane z funkcji `family_progress()` – tylko podsumowania, tylko dla zalogowanych członków rodziny.

Przy dodawaniu nowego pliku treści dopisz go do listy `ASSETS` w `sw.js` (kontrola treści to wychwyci).

## Ćwiczenia na mapie i statystyki trudnych pytań
6. **Ćwiczenia na mapie** (`#mapa`, `js/mapa.js`) – fikcyjny akwen 54°40′–55°10′N, 017°00′–017°50′E w odwzorowaniu Merkatora: podziałki minut na ramkach, latarnie z charakterystykami, pławy IALA, głębokości, ławica, róża kompasowa (deklinacja 5°E). Przybliżanie (＋/－, szczypta, kółko myszy), przesuwanie palcem, **linijka** (kierunek rzeczywisty i odległość w Mm). Zadania (losowe dane): odczyt pozycji (±0,3′), naniesienie pozycji (±0,4 Mm), pozycja z dwóch namiarów (obliczenie NR, wykreślenie, wskazanie PO), zliczenie drogi (KR, droga, odczyt PZ), kurs i czas przejścia (KR, odległość, KK, czas). Wyniki trafiają do Historii.
7. **Trudne pytania** (`#trudne`, link w Historii) – licznik błędów każdej fiszki (`wrong`, także błędy z egzaminów), procent błędów w działach, lista najczęstszych błędów i sesja „Ćwicz najtrudniejsze”.
