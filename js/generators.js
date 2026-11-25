/* Sternik Morski – generator zadań obliczeniowych (nawigacja).
 * Każde wywołanie tworzy nowe zadanie z losowymi danymi i rozwiązaniem krok po kroku.
 * Konwencja znaków (jak w polskich podręcznikach):
 *   KM = KK + δ (dewiacja),  KR = KM + d (deklinacja),  cp = δ + d,  KR = KK + cp
 *   E (wschodnia) = „+”,  W (zachodnia) = „−”
 *   KDw = KR + pw (dryf: wiatr z lewej burty → pw „+”, z prawej → „−”)
 */
(function () {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const norm = (x) => ((x % 360) + 360) % 360;
  const deg = (x) => String(Math.round(norm(x))).padStart(3, '0') + '°';
  const sgn = (x) => (x > 0 ? `+${x}°` : x < 0 ? `−${-x}°` : '0°');
  const ew = (x) => (x === 0 ? '0°' : `${Math.abs(x)}°${x > 0 ? 'E' : 'W'}`);
  const nonzero = (a, b) => { let v = 0; while (v === 0) v = rnd(a, b); return v; };
  const fmt = (x, d) => String(Math.round(x * 10 ** (d || 1)) / 10 ** (d || 1)).replace('.', ',');
  // 3 różne błędne odpowiedzi (typowe pomyłki), uzupełniane w razie powtórzeń
  function mc(correct, cands, filler) {
    const out = [];
    for (const c of cands) if (c !== correct && !out.includes(c)) out.push(c);
    let k = 1;
    while (out.length < 3 && k < 50) { const f = filler(k++); if (f !== correct && !out.includes(f)) out.push(f); }
    return { correct, wrong: out.slice(0, 3) };
  }
  const degMc = (label, c, cands) => mc(`${label} = ${deg(c)}`, cands.map((x) => `${label} = ${deg(x)}`), (k) => `${label} = ${deg(c + (k % 2 ? k + 1 : -k - 1))}`);
  const numMc = (c, cands, f, unit) => mc(`${f(c)}${unit}`, cands.map((x) => `${f(x)}${unit}`), (k) => `${f(c * (1 + (k % 2 ? 0.15 : -0.15) * Math.ceil(k / 2)))}${unit}`);
  const hhmm = (h) => { const t = Math.round(h * 60); return `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')} min`; };

  const G = {
    // KK → KR
    'kompas-kr'() {
      const kk = rnd(0, 359), dv = nonzero(-6, 6), dc = nonzero(-4, 7);
      const km = norm(kk + dv), kr = norm(km + dc);
      return {
        q: `Kurs kompasowy KK = ${deg(kk)}, dewiacja δ = ${ew(dv)}, deklinacja d = ${ew(dc)}. Oblicz kurs magnetyczny KM i rzeczywisty KR.`,
        a: `KM = ${deg(km)}, KR = ${deg(kr)}`,
        explain: `KM = KK + δ = ${deg(kk)} ${sgn(dv)} = ${deg(km)}\nKR = KM + d = ${deg(km)} ${sgn(dc)} = ${deg(kr)}\n(cp = δ + d = ${sgn(dv + dc)})`,
        tip: 'Od kompasu do mapy dodajesz poprawki ze znakiem: E = +, W = −.',
        mc: degMc('KR', kr, [kk - dv - dc, kk - dv + dc, kk + dv - dc]),
        num: [{ label: 'KR', value: kr, unit: '°', tol: 0.5, circ: true }]
      };
    },
    // KR → KK (wyznaczanie kursu do sterowania)
    'kompas-kk'() {
      const kr = rnd(0, 359), dv = nonzero(-6, 6), dc = nonzero(-4, 7);
      const km = norm(kr - dc), kk = norm(km - dv);
      return {
        q: `Z mapy odczytałaś kurs rzeczywisty KR = ${deg(kr)}. Deklinacja d = ${ew(dc)}, dewiacja δ = ${ew(dv)}. Jaki kurs kompasowy KK podasz sternikowi?`,
        a: `KK = ${deg(kk)} (KM = ${deg(km)})`,
        explain: `KM = KR − d = ${deg(kr)} ${sgn(-dc)} = ${deg(km)}\nKK = KM − δ = ${deg(km)} ${sgn(-dv)} = ${deg(kk)}`,
        tip: 'Od mapy do kompasu odejmujesz poprawki (znaki odwracasz).',
        mc: degMc('KK', kk, [kr + dc + dv, kr - dc + dv, kr + dc - dv]),
        num: [{ label: 'KK', value: kk, unit: '°', tol: 0.5, circ: true }]
      };
    },
    // namiar kompasowy → rzeczywisty
    'namiar'() {
      const nk = rnd(0, 359), dv = nonzero(-6, 6), dc = nonzero(-4, 7);
      const nr = norm(nk + dv + dc);
      return {
        q: `Namiar kompasowy na latarnię NK = ${deg(nk)} (kompas sterowy, δ dla bieżącego kursu = ${ew(dv)}), deklinacja d = ${ew(dc)}. Jaki namiar rzeczywisty NR wykreślisz na mapie?`,
        a: `NR = ${deg(nr)}`,
        explain: `cp = δ + d = ${sgn(dv)} ${sgn(dc)} = ${sgn(dv + dc)}\nNR = NK + cp = ${deg(nk)} ${sgn(dv + dc)} = ${deg(nr)}`,
        tip: 'Dewiacja zależy od KURSU jachtu, a nie od kierunku namiaru.',
        mc: degMc('NR', nr, [nk - dv - dc, nk + dv - dc, nk - dv + dc]),
        num: [{ label: 'NR', value: nr, unit: '°', tol: 0.5, circ: true }]
      };
    },
    // poprawka całkowita z dwóch kursów
    'poprawka'() {
      const kk = rnd(0, 359), delta = nonzero(-9, 9), kr = norm(kk + delta);
      return {
        q: `Płynąc nabieżnikiem o kierunku rzeczywistym ${deg(kr)}, odczytujesz na kompasie ${deg(kk)}. Ile wynosi poprawka całkowita kompasu cp?`,
        a: `cp = ${sgn(delta)}`,
        explain: `cp = KR − KK = ${deg(kr)} − ${deg(kk)} = ${sgn(delta)}`,
        tip: 'Nabieżnik (dwa znaki w jednej linii) to najlepszy sposób sprawdzenia kompasu.',
        mc: mc(`cp = ${sgn(delta)}`, [`cp = ${sgn(-delta)}`, `cp = ${sgn(delta + 2)}`, `cp = ${sgn(delta - 2)}`], (k) => `cp = ${sgn(delta + k + 2)}`)
      };
    },
    // aktualizacja deklinacji z mapy
    'deklinacja'() {
      const year = 2026, base = pick([2010, 2012, 2015, 2018, 2020]);
      const d0 = rnd(0, 6) * 60 + pick([0, 10, 15, 20, 30, 40, 45]); // minuty
      const dir = pick(['E', 'W']);
      const ch = rnd(3, 12), chDir = pick(['E', 'W']);
      const yrs = year - base;
      const signed0 = dir === 'E' ? d0 : -d0;
      const signedCh = chDir === 'E' ? ch : -ch;
      const now = signed0 + signedCh * yrs;
      const dm = (m) => `${Math.floor(Math.abs(m) / 60)}°${String(Math.abs(m) % 60).padStart(2, '0')}′${m >= 0 ? 'E' : 'W'}`;
      return {
        q: `Na róży mapy: „${dm(signed0)} ${base} (${ch}′${chDir})”. Ile wynosi deklinacja w ${year} r.?`,
        a: `d ≈ ${dm(now)}`,
        explain: `Liczba lat: ${year} − ${base} = ${yrs}\nZmiana: ${yrs} × ${ch}′${chDir} = ${Math.abs(signedCh * yrs)}′${chDir}\n${dm(signed0)} ${signedCh >= 0 ? '+' : '−'} ${Math.abs(signedCh * yrs)}′ = ${dm(now)}`,
        tip: 'Zmiana roczna „E” przesuwa deklinację na wschód (+), „W” na zachód (−).',
        mc: mc(`d ≈ ${dm(now)}`, [`d ≈ ${dm(signed0 - signedCh * yrs)}`, `d ≈ ${dm(signed0)}`, `d ≈ ${dm(signed0 + signedCh)}`], (k) => `d ≈ ${dm(now + 7 * k)}`)
      };
    },
    // zliczenie: droga / czas / prędkość
    'zliczenie'() {
      const t = pick(['droga', 'czas', 'predkosc']);
      const v = rnd(8, 16) / 2; // 4–8 w, co 0,5
      if (t === 'droga') {
        const min = pick([20, 30, 40, 45, 50, 75, 90, 105, 150]);
        const s = v * min / 60;
        return { q: `Jacht płynie ${fmt(v)} w przez ${min} min. Jaką drogę przebył?`, a: `${fmt(s, 2)} Mm`,
          explain: `s = v × t = ${fmt(v)} w × ${min}/60 h = ${fmt(s, 2)} Mm`, tip: 'Minuty zamień na godziny: dziel przez 60.',
          mc: numMc(s, [v * min / 100, v * min / 30, s + 1], (x) => fmt(x, 2), ' Mm'),
          num: [{ label: 'droga', value: s, unit: 'Mm', tol: 0.06 }] };
      }
      if (t === 'czas') {
        const s = rnd(6, 40);
        return { q: `Do celu jest ${s} Mm, prędkość nad dnem ${fmt(v)} w. Ile potrwa przejście?`, a: hhmm(s / v),
          explain: `t = s / v = ${s} / ${fmt(v)} = ${fmt(s / v, 2)} h = ${hhmm(s / v)}`,
          mc: mc(hhmm(s / v), [hhmm(Math.floor(s / v) + (s / v % 1) * 0.6), hhmm(s / v + 1), hhmm(Math.max(0.25, s / v - 0.5))], (k) => hhmm(s / v + k * 0.25)) };
      }
      const min = pick([30, 40, 45, 60, 90, 120]), s = rnd(3, 14);
      return { q: `W ciągu ${min} min jacht przepłynął ${s} Mm. Jaka była średnia prędkość?`, a: `${fmt(s / (min / 60), 2)} w`,
        explain: `v = s / t = ${s} Mm / ${fmt(min / 60, 2)} h = ${fmt(s / (min / 60), 2)} w`,
        mc: numMc(s / (min / 60), [s / min * 100, s * min / 60, s / (min / 60) + 1], (x) => fmt(x, 2), ' w'),
        num: [{ label: 'prędkość', value: s / (min / 60), unit: 'w', tol: 0.06 }] };
    },
    // dryf
    'dryf'() {
      const kr = rnd(0, 359), a = rnd(3, 12), side = pick(['lewej', 'prawej']);
      const alpha = side === 'lewej' ? a : -a;
      const kdw = norm(kr + alpha);
      return {
        q: `Jacht idzie kursem rzeczywistym KR = ${deg(kr)}, wiatr wieje z ${side} burty, kąt dryfu ${a}°. Oblicz kąt drogi po wodzie KDw.`,
        a: `KDw = ${deg(kdw)}`,
        explain: `Wiatr z ${side} burty → jacht znoszony na ${side === 'lewej' ? 'prawo' : 'lewo'} → pw = ${sgn(alpha)}\nKDw = KR + pw = ${deg(kr)} ${sgn(alpha)} = ${deg(kdw)}`,
        tip: 'Wiatr z lewej burty = dryf „+”, z prawej = „−”.',
        mc: degMc('KDw', kdw, [kr - alpha, kr, kr + 2 * alpha]),
        num: [{ label: 'KDw', value: kdw, unit: '°', tol: 0.5, circ: true }]
      };
    },
    // widnokrąg i zasięg geograficzny światła
    'widnokrag'() {
      const e = pick([2, 2.5, 3, 4, 5]), H = pick([9, 16, 25, 36, 49, 64]);
      const de = 2.08 * Math.sqrt(e), dH = 2.08 * Math.sqrt(H);
      return {
        q: `Oko obserwatora jest ${fmt(e)} m nad wodą, światło latarni na wysokości ${H} m. Z jakiej odległości (zasięg geograficzny) zobaczysz światło?`,
        a: `≈ ${fmt(dH + de, 1)} Mm`,
        explain: `D = 2,08 × (√H + √e) = 2,08 × (${fmt(Math.sqrt(H), 2)} + ${fmt(Math.sqrt(e), 2)}) ≈ ${fmt(dH + de, 1)} Mm\n(widnokrąg obserwatora ≈ ${fmt(de, 1)} Mm, latarni ≈ ${fmt(dH, 1)} Mm)`,
        tip: 'Faktycznie zobaczysz światło z mniejszej z odległości: zasięgu geograficznego i nominalnego (świetlnego).',
        mc: numMc(dH + de, [dH, 2.08 * Math.sqrt(H + e), Math.sqrt(H) + Math.sqrt(e)], (x) => '≈ ' + fmt(x, 1), ' Mm'),
        num: [{ label: 'zasięg', value: dH + de, unit: 'Mm', tol: 0.08 }]
      };
    },
    // reguła dwunastek
    'dwunastki'() {
      const lw = rnd(3, 12) / 10, range = rnd(20, 60) / 10, h = rnd(1, 5);
      const parts = [0, 1, 3, 6, 9, 11, 12][h];
      const height = lw + range * parts / 12;
      return {
        q: `Niska woda (LW) ${fmt(lw)} m, wysoka woda (HW) ${fmt(lw + range)} m, przybór trwa 6 h. Jaka będzie wysokość pływu ${h} h po LW (reguła dwunastek)?`,
        a: `≈ ${fmt(height, 1)} m`,
        explain: `Rozstęp R = ${fmt(lw + range)} − ${fmt(lw)} = ${fmt(range)} m\nKolejne godziny: 1/12, 2/12, 3/12, 3/12, 2/12, 1/12 → po ${h} h: ${parts}/12\nh = ${fmt(lw)} + ${fmt(range)} × ${parts}/12 ≈ ${fmt(height, 1)} m`,
        tip: 'Najszybciej woda przybywa w 3. i 4. godzinie (po 3/12 rozstępu).',
        mc: numMc(height, [lw + range * h / 6, lw + range * Math.min(12, parts + 2) / 12, lw + range * Math.max(0, parts - 2) / 12], (x) => '≈ ' + fmt(x, 1), ' m')
      };
    },
    // prędkość graniczna kadłuba wypornościowego
    'predkosc-graniczna'() {
      const lwl = rnd(12, 30) / 2; // 6–15 m
      const v = 2.43 * Math.sqrt(lwl);
      return {
        q: `Jacht ma długość linii wodnej LWL = ${fmt(lwl)} m. Jaka jest jego przybliżona prędkość graniczna (kadłub wypornościowy)?`,
        a: `≈ ${fmt(v, 1)} w`,
        explain: `v ≈ 2,43 × √LWL = 2,43 × √${fmt(lwl)} = 2,43 × ${fmt(Math.sqrt(lwl), 2)} ≈ ${fmt(v, 1)} w`,
        tip: 'Dłuższa linia wodna = wyższa prędkość graniczna. Powyżej niej opór fali rośnie gwałtownie.',
        mc: numMc(v, [1.34 * Math.sqrt(lwl), 2.43 * lwl / 2, v + 2], (x) => '≈ ' + fmt(x, 1), ' w')
      };
    },
    // planowanie: godzina przybycia
    'eta'() {
      const depH = rnd(5, 14), depM = pick([0, 15, 30, 45]);
      const dist = rnd(12, 60), v = rnd(8, 12) / 2;
      const t = dist / v; const arr = depH * 60 + depM + Math.round(t * 60);
      const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      return {
        q: `Wyjście z portu o ${hm(depH * 60 + depM)}, do celu ${dist} Mm, planowana średnia prędkość ${fmt(v)} w. O której przewidujesz przybycie (ETA)?`,
        a: `ok. ${hm(arr)}${arr >= 1440 ? ' (następnego dnia)' : ''}`,
        explain: `t = ${dist} / ${fmt(v)} = ${fmt(t, 2)} h = ${hhmm(t)}\nETA = ${hm(depH * 60 + depM)} + ${hhmm(t)} = ${hm(arr)}`,
        tip: 'Planując rejs, dolicz zapas czasu (wiatr, prąd, manewry) i sprawdź, czy wejście do portu wypada za dnia i przy odpowiednim stanie wody.',
        mc: mc(`ok. ${hm(arr)}`, [`ok. ${hm(arr + 60)}`, `ok. ${hm(arr - 30)}`, `ok. ${hm(depH * 60 + depM + Math.floor(t) * 60 + Math.round((t % 1) * 100))}`], (k) => `ok. ${hm(arr + 15 * (k + 1))}`)
      };
    },
    // głębokość rzeczywista
    'glebokosc'() {
      const chart = rnd(5, 40) / 10, tide = rnd(5, 45) / 10, draft = pick([1.4, 1.6, 1.8, 2.0]);
      const depth = chart + tide, ukc = depth - draft;
      return {
        q: `Głębokość z mapy ${fmt(chart)} m, wysokość pływu ${fmt(tide)} m, zanurzenie jachtu ${fmt(draft)} m. Jaka jest głębokość wody i zapas pod kilem?`,
        a: `głębokość ${fmt(depth)} m, zapas ${fmt(ukc)} m`,
        explain: `Głębokość = głębokość z mapy + wysokość pływu = ${fmt(chart)} + ${fmt(tide)} = ${fmt(depth)} m\nZapas = ${fmt(depth)} − ${fmt(draft)} = ${fmt(ukc)} m`,
        mc: mc(`głębokość ${fmt(depth)} m, zapas ${fmt(ukc)} m`, [`głębokość ${fmt(chart)} m, zapas ${fmt(chart - draft)} m`, `głębokość ${fmt(depth)} m, zapas ${fmt(depth + draft)} m`, `głębokość ${fmt(Math.abs(tide - chart))} m, zapas ${fmt(Math.abs(tide - chart) - draft)} m`], (k) => `głębokość ${fmt(depth + k * 0.3)} m, zapas ${fmt(ukc + k * 0.3)} m`)
      };
    }
  };

  window.Generators = {
    make(kind) { const f = G[kind]; return f ? f() : { q: '(brak generatora)', a: '' }; },
    kinds: Object.keys(G),
    numeric: ['kompas-kr', 'kompas-kk', 'namiar', 'dryf', 'zliczenie', 'widnokrag']
  };
})();
