# Pokrycie bazy przykładowych pytań PZŻ (JSM) przez lekcje aplikacji

Analiza 329 pytań z bazy przykładowych pytań PZŻ na jachtowego sternika morskiego (2026-11-26). Pytania przechowywane są wyłącznie w prywatnej tabeli Supabase (exam_questions, dostęp tylko dla członków rodziny) – nie w tym repozytorium. Poniżej tylko tematy, bez treści pytań.

| Dział PZŻ | pokryte | niepokryte |
|---|---|---|
| JACHTY ŻAGLOWE MORSKIE | 11 | 29 |
| LOCJA | 25 | 9 |
| METEOROLOGIA | 25 | 10 |
| MPZZM | 40 | 5 |
| NAWIGACJA | 26 | 10 |
| PLANOWANIE REJSÓW | 24 | 24 |
| RATOWNICTWO | 33 | 21 |
| SYGNALIZACJA I ŁĄCZNOŚĆ | 27 | 10 |

Wgrano do aplikacji 288 pytań (pominięto 33 wymagające oryginalnego rysunku, 3 bez możliwego klucza, 5 z pustymi odpowiedziami w arkuszu). Klucz odpowiedzi ustalony samodzielnie (PZŻ go nie publikuje): pewność wysoka 188, średnia 100, niska 41 (pytania z niską pewnością mają w wyjaśnieniu dopisek „do weryfikacji”).

## Uzupełnienie (2026-11-26)

Wszystkie 118 niepokrytych tematów zostało uzupełnione: **152 nowe fiszki i 5 nowych lekcji** (Wyposażenie jachtu morskiego wg przepisów; Publikacje, mapy i czarter w planowaniu dalszych rejsów; Elektryka, sterowanie i napęd; Takielunek, żagle i kotwiczenie; Pierwsza pomoc na jachcie – urazy i oparzenia) oraz uzupełnienia w istniejących lekcjach poziomów 2–7. Źródła robocze: `content/review2/area-*.json`, wprowadzone skryptem `tools/apply_additions.py`.

Rozbieżności klucza PZŻ z aktualnymi przepisami: nr 217 (radar – wymagany od 20 m, odpowiedź zmieniona na C), nr 197 (sekstant – w rejonie 4 tylko zalecany; zostawiono odpowiedź oczekiwaną na egzaminie z adnotacją), nr 304 (dzwon – wg MPZZ od 20 m, egzamin oczekuje 12 m), nr 66 (nabieżnik – reguła: kurs w stronę stawy dolnej; pytanie pominięte, wymaga rysunku).

## Tematy, które były niepokryte (stan przed uzupełnieniem)

### JACHTY ŻAGLOWE MORSKIE (29)
- [Sterociągi – luz na kole sterowym] Brak informacji o układzie sterowym ze sterociągami i regulacji ich napięcia ściągaczami.
- [Lazy jack] Brak opisu systemu lazy jack (linki maszt–bom prowadzące grot przy zrzucaniu).
- [Wymiana oleju w silniku jachtowym] Brak informacji o wymianie oleju pompką (odsysanie przez bagnet) i zabieraniu jej na rejs.
- [Mieszanka do silnika dwusuwowego] Brak informacji o silnikach dwusuwowych i proporcji mieszanki olej–benzyna wg instrukcji producenta.
- [Śruba o zmiennym skoku] Brak informacji o śrubie nastawnej (o zmiennym skoku) i jej działaniu wstecz.
- [Krętlik łańcucha kotwicznego] Brak treści o połączeniu łańcucha z kotwicą (szekla, krętlik) i jego wytrzymałości.
- [Typy kotwic i siła trzymania] Brak lekcji o typach kotwic (Danforth, CQR, Delta, admiralicji, Bruce) i ich sile trzymania.
- [Długość łańcucha kotwicznego] Brak informacji o wymaganej długości łańcucha kotwicznego i zasadzie wydawania 3–5 głębokości (więcej przy linie).
- [Paliwo do silnika dwusuwowego] Brak informacji, że silniki dwusuwowe smaruje olej dodany do benzyny (mieszanka).
- [Butle gazowe w różnych krajach] Brak informacji o braku unifikacji butli gazowych i przyłączy w różnych krajach.
- [Ładowanie akumulatorów] Brak informacji o prądzie i czasie ładowania akumulatora (ok. 0,1 C) i obliczeniach P = U × I.
- [Alternator i przełączanie baterii] Brak informacji, że alternatora nie wolno pozostawiać bez obciążenia (rozłączać baterii podczas ładowania).
- [Obsługa akumulatorów kwasowych] Brak informacji o obsłudze akumulatorów kwasowych (kontrola elektrolitu, dolewanie wody destylowanej).
- [Silnik nie startuje – akumulator naładowany] Brak informacji o diagnostyce rozruchu (napięcie akumulatora, klemy, przewody rozrusznika).
- [Silnik nie startuje – rozładowany akumulator] Brak informacji o napięciach akumulatora 12 V (pełny ok. 12,7 V, rozładowany ok. 10,5–11,8 V).
- [Liczba gaśnic na jachcie] Brak zasad rozmieszczenia gaśnic wg przepisów (kokpit, każdy przedział mieszkalny, kambuz, silnik).
- [Części zapasowe do silnika] Brak listy podstawowych części zapasowych do silnika (olej, filtry oleju i paliwa, paski klinowe, impeller).
- [Atesty wyposażenia jachtu] Brak informacji, które elementy wyposażenia wymagają atestu (tratwa, zwalniak, kompas, reflektor radarowy), a które tylko zgodności z normą.
- [Mocowanie tratwy ratunkowej] Brak informacji o haku odrzutnym w mocowaniu tratwy (obok zwalniaka hydrostatycznego).
- [Atest tratwy i zwalniaka] Brak informacji o wymaganej ważności przeglądu tratwy i daty ważności zwalniaka hydrostatycznego.
- [Obowiązkowa pirotechnika] Brak wymagań ilościowych pirotechniki wg rejonów żeglugi (np. rejon 3: 12 rakiet spadochronowych + pławka dymna).
- [Obowiązkowe koła ratunkowe] Brak wymogu 2 kół ratunkowych (z pławką świetlną i z linką) na jachcie morskim.
- [Przepisy o wyposażeniu jachtu] Brak informacji o rozporządzeniu w sprawie bezpiecznego uprawiania żeglugi przez jachty morskie i jego załącznikach z wyposażeniem.
- [Obsługa spinakera] Brak lekcji o spinakerze (bras, szot, kontrabras, topenanta bomu spinakera) i jego obsłudze przy zmianie kursu.
- [Napinacz achtersztagu] Brak informacji o regulacji achtersztagu i luzowaniu go na postoju.
- [Spinakerbom] Brak informacji o linach ustawiających spinakerbom (bras, kontrabras, topenanta).
- [Topenanta] Takielunek ruchomy wymienia topenantę, ale nie mówi, że podtrzymuje ona bom za nok.
- [Kategorie projektowe CE] Brak informacji o kategoriach projektowych CE jachtów (A, B, C, D – wiatr i fala).
- [Autopilot] Brak informacji o autopilocie i przejściu na sterowanie ręczne (tryb STAND BY).

### LOCJA (9)
- [Rodzaj dna na mapie a kotwiczenie] Brak skrótów rodzaju dna na mapach polskich (p – piasek, m – muł, sk – skała, kam – kamienie itd.) i oceny, które dno dobrze trzyma kotwicę.
- [Osuchy na mapie] Brak informacji, że liczba podkreślona na mapie to osuch (wysokość nad zerem mapy, odsłaniana przy niskiej wodzie).
- [Charakterystyka dna na mapie] Brak informacji, że rodzaj dna oznacza się na mapach skrótami literowymi (S, M, R, Sh / p, m, sk).
- [Strefa czasowa w tablicach pływów] Brak wyjaśnienia konwencji znaku strefy czasu w tablicach pływów (Time Zone −0200 = UTC+2, odjąć 2 h do UTC) i przeliczenia na czas okrętowy.
- [Odczyt atlasu prądów pływowych] Brak zapisu prędkości w atlasie prądów (np. 13,26 = 1,3 w kwadratura / 2,6 w syzygia) i tego, że strony atlasu odnoszą się do godzin przed/po HW w porcie odniesienia.
- [Atlas prądów wymaga tablic pływów] Brak informacji, że do użycia atlasu prądów lub rombów na mapie potrzebny jest moment HW w porcie odniesienia z tablic pływów.
- [Zapis głębokości na mapie polskiej] Brak informacji o zapisie głębokości na mapach polskich (metry, decymetry jako mała cyfra w indeksie, np. 2₅ = 2,5 m).
- [Nabieżnik – korekta kursu] Brak zasady korekty kursu na nabieżniku: płynie się w stronę, po której widać stawę górną (tylną) względem dolnej.
- [Symbole kierunkowe na mapie] Brak symboli mapy: zalecany kierunek ruchu statków i umowny kierunek oznakowania (strzałka z kółkami).

### METEOROLOGIA (10)
- [Pobieranie plików GRIB na morzu] Brak informacji o plikach GRIB i sposobach ich odbioru na morzu (radio KF/SSB z modemem, satelita, internet).
- [Skala Petersena a skala Beauforta] Brak wzmianki o skali Petersena (stan morza przypisany stopniom Beauforta).
- [Odczyt prognozy NAVTEX] Brak ćwiczenia z odczytu angielskiej prognozy NAVTEX (rejony morskie, zapis „SW 5 TO 6”, „BECOMING”, sea state, visibility).
- [Meteogram ICM – kierunek i siła wiatru] Brak informacji o odczycie meteogramu ICM (strzałki/kreski wiatru, siła w °B w kolejnych godzinach).
- [Prognoza wiatru przy przemieszczaniu się niżu] Brak przykładu, jak przemieszczanie się niżu (pogłębianie, przejście na wschód) przekłada się na kierunek i siłę wiatru w danym miejscu.
- [Umieszczenie termometru] Brak zasady umieszczania termometru (w cieniu, z dala od źródeł ciepła, osłonięty od słońca).
- [Przeliczanie węzłów na °B] Brak przybliżonego wzoru przeliczenia węzłów na stopnie Beauforta (°B ≈ (w + 5)/5).
- [Jednostki prędkości wiatru w komunikatach] Brak informacji, że w komunikatach wiatr podaje się zależnie od kraju w °B, m/s lub węzłach.
- [Wiatr pozorny a rzeczywisty] Brak wyjaśnienia, jak z wiatru pozornego i prędkości/kursu jachtu wyznaczyć wiatr rzeczywisty.
- [Wiatr przyziemny w niżu] Brak informacji, że wiatr przyziemny przecina izobary pod kątem ok. 20–40° w stronę środka niżu (efekt tarcia).

### MPZZM (5)
- [Sygnały manewrowe – reakcja na 2 krótkie] Brak przykładu, jak zareagować na sygnał manewrowy innego statku (np. 2 krótkie przy wyjściu z kanału) – karty uczą tylko znaczenia sygnału.
- [Okrężnica – żółte światła migające] Brak informacji, że dwa żółte światła migające na przemian (Zał. II MPZZ) oznaczają statek łowiący okrężnicą, który mija się z daleka.
- [Śródlądowe sygnały dźwiękowe] Brak tabeli śródlądowych sygnałów dźwiękowych (4 krótkie – nie mogę manewrować, seria bardzo krótkich – niebezpieczeństwo, seria podwójnych krótkich – człowiek za burtą).
- [Definicja małego statku (śródlądowe)] Brak definicji: mały statek to < 20 m, ale bez statków pasażerskich (ponad 12 pasażerów), holowników i pchaczy.
- [Śródlądowe: oznakowanie strony wolnej] Brak śródlądowego oznakowania statków przy pracy/na mieliźnie: flaga czerwono-biała (nocą 2 zielone) – strona wolna, flaga czerwona (czerwone światło) – strona zamknięta.

### NAWIGACJA (10)
- [Log burtowy – pomiar prędkości] Brak metody „logu burtowego” (pomiar czasu przejścia przedmiotu wzdłuż burty; v[w] ≈ 1,94 × L[m] / t[s]).
- [Funkcja MOB plotera] Brak informacji, że po wciśnięciu MOB ploter podaje namiar i odległość do punktu wypadnięcia, którymi należy się kierować.
- [Zamawianie map z katalogu] Brak informacji o katalogach map (np. Admiralty Catalogue) i zamawianiu map po numerach.
- [Czynniki wpływające na dryf] Brak informacji, od czego zależy wielkość dryfu (prędkość jachtu, siła wiatru, fala, kurs względem wiatru, kształt kadłuba).
- [Izobata jako linia pozycyjna] Brak warunku, że izobata jest użyteczną linią pozycyjną tylko przy regularnym przebiegu dna.
- [Odległość z kąta pionowego] Brak metody wyznaczania odległości z kąta pionowego (tablice lub D[Mm] ≈ 1,856 · h[m] / α[′]).
- [Mapa rastrowa a papierowa] Brak wyjaśnienia różnicy między mapą rastrową (skan mapy papierowej) a wektorową.
- [Znak poprawki na prąd] Brak reguły znaku poprawki na prąd (z lewej burty „+”, z prawej „−”, prąd wzdłuż kursu – 0).
- [Oznakowanie sondy ręcznej] Brak opisu sondy ręcznej i jej oznakowania (znaki co 1 m, kolory co 5 m: niebieski–czerwony–biały–żółty).
- [Deklinacja na mapach generalnych – izogony] Brak informacji o izogonach – liniach jednakowej deklinacji na mapach małoskalowych.

### PLANOWANIE REJSÓW (24)
- [Wymagane wyposażenie nawigacyjne (GPS)] Brak wymagań wyposażenia nawigacyjnego jachtu w zależności od rejonu żeglugi (np. GPS od żeglugi przybrzeżnej, sekstant tylko w oceanicznej).
- [Czarter jachtu – co sprawdzić] Brak listy kontrolnej przy czarterze: dopuszczenie jachtu do rejonu żeglugi, wyposażenie, zakres terytorialny ubezpieczenia.
- [Mapy elektroniczne a przepisy] Brak przepisu, kiedy mapy elektroniczne mogą zastąpić papierowe (zdublowany system).
- [Wyposażenie wg rejonu żeglugi] Brak zasady, że wymagane wyposażenie zależy od rejonu żeglugi faktycznie uprawianej (załącznik nr 1 do rozporządzenia).
- [Sekstant w wyposażeniu jachtu] Brak informacji, że sekstant jest wymagany tylko w żegludze oceanicznej.
- [AIS – obowiązek na jachcie] Brak informacji, że AIS jest na jachtach zalecany, a nie obowiązkowy.
- [Wydawnictwa żeglarskie na rejs] Brak informacji o żeglarskich przewodnikach i mapach jachtowych (plany marin) jako podstawowej pomocy w rejsach turystycznych.
- [ALRS vol. 5 – ratownictwo] Brak informacji, że Admiralty List of Radio Signals tom 5 zawiera dane o GMDSS i ratownictwie na całym świecie.
- [Wejście do portu pływowego za śluzą] Brak informacji, że porty za śluzą (wrotami) są dostępne w okolicy HW i podejście planuje się przed wysoką wodą.
- [Wybór okna pogodowego] Brak przykładu planowania momentu wyjścia pod prognozowaną zmianę kierunku i siły wiatru.
- [Długość łańcucha kotwicznego] Brak zasady długości łańcucha/liny kotwicznej (ok. 3–5× głębokość łańcucha, więcej dla liny i przy złym dnie).
- [Wydłużenie drogi przy halsowaniu] Brak obliczenia wydłużenia drogi przy halsowaniu (1/cos połowy kąta martwego: 90° → +41%, 120° → +100%).
- [GRIB i prognozy na długi przelot] Brak informacji o plikach GRIB i prognostycznych mapach pogody pobieranych przed długim przelotem.
- [Zapoznanie załogi z jachtem] Brak informacji, że po alarmach załogę zapoznaje się z obsługą żagli, refowania, kotwicy i silnika.
- [Apteczka jachtowa] Brak informacji, że zawartość apteczki na długi rejs ustala się według zaleceń (najlepiej z lekarzem), bo przepisy jej nie określają.
- [Radar – wymagania] Brak informacji, że radar nie jest obowiązkowy na jachtach.
- [Lina holownicza] Brak informacji o potrzebie posiadania długiej liny holowniczej na jachcie.
- [Mapy do planowania długiego rejsu] Brak podziału map wg skali (generalne, żeglugowe, podejściowe, plany portów) i ich zastosowania.
- [Planowanie długiego przelotu] Brak informacji o planowaniu długich przelotów z użyciem prądów stałych i klimatycznych danych meteo.
- [Jachty w systemie rozgraniczenia ruchu] Brak zasady z prawidła 10(j): statki < 20 m i żaglowe w TSS nie mogą utrudniać przejścia statkom mechanicznym na torze.
- [Pokonywanie fali w sztormie] Brak techniki pokonywania pojedynczej fali (ostrzenie przed grzbietem, odpadanie za nim).
- [Routeing Charts] Brak informacji o mapach miesięcznych Routeing/Pilot Charts do planowania przelotów oceanicznych.
- [Pirotechnika wg karty bezpieczeństwa] Brak informacji, że wymagane wyposażenie (w tym pirotechnika) wynika z karty bezpieczeństwa jachtu.
- [Mapy papierowe a elektroniczne] Brak przepisu: mapy elektroniczne mogą zastąpić papierowe tylko przy zdublowanym systemie.

### RATOWNICTWO (21)
- [Pożar w komorze silnika] Brak zasady gaszenia pożaru w komorze silnika przez lekko uchyloną pokrywę/otwór gaśniczy (bez szerokiego otwierania).
- [Udrożnienie dróg oddechowych] Brak informacji o udrożnieniu dróg oddechowych (odchylenie głowy, uniesienie żuchwy) przed RKO.
- [Skuteczność EPIRB] Brak informacji o typach radiopław (406 MHz vs 121,5 MHz) i ograniczeniach ich zasięgu/pokrycia.
- [Obszar odpowiedzialności polskiej SAR] Brak opisu zasięgu polskiego rejonu SAR (południowy Bałtyk, bez Bornholmu).
- [Radiostacja brzegowa – łączność w niebezpieczeństwie] Brak informacji o polskiej radiostacji brzegowej (Witowo Radio / Polish Rescue Radio) prowadzącej nasłuch i łączność w niebezpieczeństwie.
- [Awaria sztagu] Brak informacji, jak postępować przy uszkodzeniu sztagu (odpaść z wiatrem, zrzucić przednie żagle, sztag zastępczy z fałów).
- [Awaria wanty] Brak informacji, że przy uszkodzonej wancie nawietrznej robi się natychmiast zwrot, by odciążyć wantę.
- [Pasy ratunkowe i bezpieczeństwa – liczba] Brak wymogu: pasy ratunkowe i pasy bezpieczeństwa dla każdej osoby na jachcie (wg rozporządzenia).
- [Pasy ratunkowe z uprzężą] Brak informacji, że kamizelka pneumatyczna ze zintegrowaną uprzężą spełnia oba wymogi (pas ratunkowy + pas bezpieczeństwa dla każdej osoby).
- [Kamizelka pneumatyczna – napełnianie ręczne] Brak informacji o rurce do ręcznego (ustnego) napełniania kamizelki pneumatycznej.
- [Żagiel przedni w sztormie (sztag wewnętrzny vs roler)] Brak informacji, że w sztormie lepszy jest sztormfok na sztagu wewnętrznym niż zrolowana genua.
- [Sygnały przy lądowaniu – kierunek] Brak sygnału: czerwona rakieta + biała rakieta (lub białe światło) wskazująca kierunek dogodniejszego lądowania.
- [Poruszanie się po pokładzie] Brak zasady poruszania się po pokładzie po burcie nawietrznej.
- [Złamanie kończyny] Brak informacji o pierwszej pomocy przy złamaniu (unieruchomienie dwóch sąsiednich stawów).
- [Uraz klatki piersiowej] Brak informacji o pierwszej pomocy przy urazie klatki piersiowej/złamaniu żeber (pozycja półsiedząca).
- [Oparzenie chemiczne kwasem] Brak informacji o oparzeniu chemicznym (długie płukanie wodą).
- [Skręcenie stawu skokowego] Brak informacji o pierwszej pomocy przy skręceniu stawu (zimne okłady, unieruchomienie).
- [Taktyka sztormowania – wybór schronienia] Brak przykładów taktyki sztormowania przy konkretnym akwenie (np. schronienie w cieniu wyspy po zawietrznej).
- [Fala krzyżowa przy zmianie kierunku wiatru] Brak informacji o fali krzyżowej po szybkiej zmianie kierunku silnego wiatru.
- [Brzegowe stacje ratownicze] Brak informacji o brzegowych stacjach ratowniczych SAR i ratowaniu z brzegu (aparat rakietowy) przy sztrandowaniu.
- [VHF – Dual Watch] Brak informacji o funkcji DW/TW (podwójny/potrójny nasłuch) w radiotelefonie VHF.

### SYGNALIZACJA I ŁĄCZNOŚĆ (10)
- [Zasięg VHF] Brak informacji o praktycznym zasięgu radiotelefonu VHF (ok. 20–30 Mm do stacji brzegowej, zależnie od wysokości anten).
- [Częstotliwości niebezpieczeństwa MF/VHF] Brak częstotliwości MF: 2182 kHz – fonia w niebezpieczeństwie, 2187,5 kHz – DSC.
- [Alarm DSC – powtarzanie] Brak informacji, że alarm DISTRESS DSC jest automatycznie powtarzany (co ok. 4 min) do potwierdzenia lub przerwania.
- [Wymagana pirotechnika jachtu (rejon pełnomorski)] Brak wymaganych ilości pirotechniki dla polskiego jachtu w poszczególnych rejonach żeglugi (rakiety spadochronowe, pochodnie, pławki dymne).
- [Sygnał zwrócenia uwagi – reflektor] Brak prawidła 36 MPZZ: sygnał zwrócenia uwagi światłem lub dźwiękiem, np. reflektor skierowany w stronę niebezpieczeństwa.
- [Zakres ciszy radiowej] Brak informacji, że cisza radiowa obowiązuje tylko na kanale, na którym trwa korespondencja w niebezpieczeństwie.
- [Odwołanie fałszywego alarmu DSC] Brak procedury odwołania przypadkowego alarmu DSC: komunikat fonią na kanale 16 „All stations… cancel my distress alert of…”.
- [Zakres pomocy SAR] Teoria L6-sar sugeruje, że SAR holuje jacht w niebezpieczeństwie; brak informacji, że jednostka SAR ratuje ludzi, a holuje jacht tylko wtedy, gdy to jedyny sposób ratowania załogi i sama o tym decyduje.
- [Kontrola EPIRB] Brak informacji, jak sprawdzić EPIRB przed rejsem: data ważności baterii i zwalniacza hydrostatycznego oraz test.
- [Wezwanie a zawiadomienie w niebezpieczeństwie] Brak rozróżnienia pojęć: wezwanie w niebezpieczeństwie (MAYDAY + identyfikacja) a zawiadomienie (treść: pozycja, zagrożenie, pomoc, osoby).

## Weryfikacja wątpliwych faktów (2026-11-26)

- **Wyposażenie nawigacyjne wg rejonów** – potwierdzone w tekście jednolitym rozporządzenia w sprawie bezpiecznego uprawiania żeglugi przez jachty morskie (Dz.U. 2016 poz. 1557, wg ISAP obowiązujące), zał. 1: kompas magnetyczny, lornetka, mapy, locje, spis świateł, MPZZ, MKS, reflektor radarowy – wszystkie rejony; barometr, GPS, tablice pływów, znaki i skróty – od rejonu 2; sekundomierz, sonda, spis radiostacji – od rejonu 3; kompas zapasowy/namiarowy – zalecany w 3, wymagany w 4; radar – rejony 2–4, tylko jachty ≥ 20 m; sekstant, chronometr, rocznik astronomiczny – tylko zalecane w rejonie 4; AIS – wszędzie zalecany. Mapy elektroniczne wektorowe zastępują papierowe przy posiadaniu wersji papierowej lub zdublowaniu systemu. Pirotechnika: rejon 1 (i T nocą) – 3 rakiety spadochronowe, rejon 2 – 6, rejony 3–4 – 12, zawsze + 1 pławka dymna.
- **Radiostacja brzegowa** – „Polish Rescue Radio” (SPL, MMSI 002618102) od 1.01.2020 r. zastąpiła „Witowo Radio”; obsługują ją operatorzy GMDSS służby VTS Urzędu Morskiego w Gdyni, współpraca z MRCK Gdynia (źródło: umgdy.gov.pl, Wiadomości Żeglarskie BHMW).
- **Kotwice** – podręcznik wskazuje Danfortha jako kotwicę o największym stosunku siły trzymania do masy (piasek, muł); współczesne testy (Practical Boat Owner 2011, West Marine 2006) stawiają najwyżej kotwice „nowej generacji” (Rocna, Mantus, Spade), najsłabiej CQR i Bruce. Fiszki podają oba fakty.
