# Sternik Morski – fiszki

Aplikacja przeglądarkowa do nauki na egzamin teoretyczny na patent **jachtowego sternika morskiego (JSM)**.

- Tryb nauki „od podstaw” (8 poziomów) i tryb losowy
- Graficzne fiszki: światła statków, znaki dzienne, oznakowanie IALA, sygnały, flagi MKS
- Później: rozbudowane tryby testowe (symulacja egzaminu 75 pytań / 120 min / próg 65)

## Dokumentacja
- [Etap 1 – zakres wiedzy na egzamin](docs/01-zakres-egzaminu-JSM.md)
- [Etap 2 – struktura fiszek](docs/02-struktura-fiszek.md)
- Etap 3 – poziom 3: pełne światła, znaki dzienne, sygnały dźwiękowe (z odtwarzaniem), sygnały wzywania pomocy, charakterystyki świateł, pozostałe znaki IALA
- [Etap 3b – konta dla rodziny](docs/03-konta-rodziny.md)
- Etap 4 – poziom 4: nawigacja i locja + generator zadań obliczeniowych (`js/generators.js`, fiszki z polem `gen`)
- Etap 5 – poziom 5: meteorologia (grafiki: układy baryczne `baric`, fronty `front`)
- Etap 6 – poziom 6: bezpieczeństwo i ratownictwo (środki ratunkowe, VHF/GMDSS, pirotechnika, EPIRB/SART, MOB, hipotermia, awarie, sztorm, SAR, pierwsza pomoc)
- Etap 7 – poziom 7: jacht i instalacje, silnik, teoria żeglowania, planowanie rejsu, dokumenty i etykieta, prawo drogi śródlądowe (+ generatory `predkosc-graniczna`, `eta`)
- Etap 8 – egzaminy: symulacja egzaminu (75 pytań, 120 min, próg 65), testy z działów, zadanie nawigacyjne; odpowiedzi testowe w `content/mc/`, weryfikacja z podręcznikiem: `content/review/` + `tools/apply_review.py`
- [Weryfikacja z podręcznikiem – lista zmian](docs/04-weryfikacja-z-podrecznikiem.md)
- [Ulepszenia: powtórki, offline, rodzina, automaty](docs/05-ulepszenia.md)
- [Pokrycie bazy pytań PZŻ przez lekcje](docs/06-pokrycie-pytan-pzz.md)
