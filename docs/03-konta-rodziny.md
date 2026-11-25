# Etap 3b – konta dla rodziny

- Logowanie: **imię + hasło** (Iga, Maciek, Stasiek, Witek). Wewnętrznie imię zamieniane jest na adres `imie@sternik-morski.app` – nie trzeba prawdziwego e-maila.
- Dane w Supabase (projekt `sternik-morski`, region eu-central-1). Schemat: `supabase/schema.sql`.
- Każda osoba widzi tylko swój postęp (`card_progress`) i historię (`study_sessions`) – pilnują tego reguły RLS.
- Rejestracja w aplikacji nie istnieje; zapisywać może tylko konto obecne w tabeli `members`.
- Postęp zapisuje się najpierw w przeglądarce, a potem wysyła do chmury (kolejka – nic nie ginie bez internetu).
- Ekrany: **Historia** (dni z rzędu, sesje w 7 dni, % odpowiedzi „wiem”, postęp poziomów, lista sesji) i **Konto** (zmiana hasła, wylogowanie).
- Wersja podglądu (`tools/bundle.py`) działa bez logowania, z postępem tylko w przeglądarce.
