/* Sternik Morski – logika aplikacji (bez zewnętrznych bibliotek). */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const V = window.Visuals;
  const STORE_KEY = 'sm-progress-v1';

  /* ---------- dane ---------- */
  let INDEX = null;            // content/levels.json
  const LEVELS = {};           // numer -> dane poziomu
  const MC = {};               // numer -> { idFiszki: {correct, wrong[]} } – odpowiedzi do testów
  async function loadJSON(path) {
    if (window.__CONTENT__ && window.__CONTENT__[path]) return window.__CONTENT__[path];
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) throw new Error('Nie udało się wczytać ' + path);
    return r.json();
  }
  async function loadAll() {
    INDEX = await loadJSON('content/levels.json');
    await Promise.all(INDEX.levels.filter((l) => l.file).map(async (l) => {
      LEVELS[l.level] = await loadJSON(l.file);
      if (l.mc) { try { MC[l.level] = (await loadJSON(l.mc)).items || {}; } catch (e) { MC[l.level] = {}; } }
    }));
  }
  const allLessons = () => Object.values(LEVELS).flatMap((lv) => lv.lessons.map((ls) => ({ ...ls, level: lv.level })));
  const findLesson = (id) => allLessons().find((l) => l.id === id);

  /* ---------- postęp: osobno dla każdej osoby; kopia w przeglądarce + synchronizacja z chmurą ---------- */
  const Cloud = window.Cloud || { enabled: false };
  let progress = {};
  const storeKey = () => (Cloud.user ? `${STORE_KEY}-${Cloud.user.id}` : STORE_KEY);
  function loadLocal() { try { progress = JSON.parse(localStorage.getItem(storeKey()) || '{}'); } catch (e) { progress = {}; } }
  function save() { try { localStorage.setItem(storeKey(), JSON.stringify(progress)); } catch (e) { /* brak pamięci – działamy dalej */ } }
  const box = (id) => (progress[id] ? progress[id].box : -1); // -1 = nowa
  function grade(id, g) {
    const p = progress[id] || { box: 0, seen: 0 };
    p.seen += 1; p.last = Date.now();
    if (g === 'bad') p.box = 0; else if (g === 'mid') p.box = Math.max(1, Math.min(p.box, 1)); else p.box = Math.min(3, Math.max(p.box, 0) + 1);
    progress[id] = p; save();
    if (Cloud.user) Cloud.queueCard(id, p);
  }
  // po zalogowaniu: łączymy postęp z chmury z kopią lokalną (wygrywa nowszy zapis)
  async function syncProgress() {
    loadLocal();
    try {
      const remote = await Cloud.loadProgress();
      Object.entries(remote).forEach(([id, r]) => {
        const l = progress[id];
        if (!l || (r.last || 0) >= (l.last || 0)) progress[id] = r;
        else Cloud.queueCard(id, l);
      });
      Object.entries(progress).forEach(([id, l]) => { if (!remote[id]) Cloud.queueCard(id, l); });
      save();
    } catch (e) { /* offline – pracujemy na kopii lokalnej */ }
  }
  function dist(cards) {
    const d = { ok: 0, learn: 0, fresh: 0, total: cards.length };
    cards.forEach((c) => { const b = box(c.id); if (b >= 2) d.ok++; else if (b >= 0) d.learn++; else d.fresh++; });
    return d;
  }
  // pasek postępu: zielone = opanowane, żółte = w trakcie, tło = nowe
  function progressBar(cards, big) {
    const d = dist(cards);
    const pct = (x) => (d.total ? (100 * x / d.total) : 0);
    return `<div class="prog${big ? ' big' : ''}">
      <div class="prog-head"><span>Opanowane <b>${d.ok}/${d.total}</b></span><b>${Math.round(pct(d.ok))}%</b></div>
      <div class="bar seg" role="img" aria-label="Opanowane ${d.ok} z ${d.total}, w trakcie ${d.learn}, nowe ${d.fresh}">
        <span class="s-ok" style="width:${pct(d.ok)}%"></span><span class="s-learn" style="width:${pct(d.learn)}%"></span></div>
      <div class="prog-legend"><span><i class="dot ok"></i>opanowane ${d.ok}</span><span><i class="dot learn"></i>w trakcie ${d.learn}</span><span><i class="dot fresh"></i>nowe ${d.fresh}</span></div>
    </div>`;
  }
  function mastery(cards) {
    if (!cards.length) return 0;
    return Math.round(100 * cards.filter((c) => box(c.id) >= 2).length / cards.length);
  }

  /* ---------- pomocnicze ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  function theoryBlock(b) {
    switch (b.t) {
      case 'p': return `<p>${md(b.text)}</p>`;
      case 'ul': return `<ul>${b.items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${b.items.map((i) => `<li>${md(i)}</li>`).join('')}</ol>`;
      case 'tip': return `<div class="tip">${md(b.text)}</div>`;
      case 'table': return `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th>${md(h)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'visual': return `<figure>${V.render(b.visual)}${b.caption ? `<figcaption>${md(b.caption)}</figcaption>` : ''}</figure>`;
      default: return '';
    }
  }

  /* ---------- widoki ---------- */
  function viewHome() {
    const lessons = allLessons();
    const allCards = lessons.flatMap((l) => l.cards);
    let html = `<h1>Jachtowy sternik morski</h1>
      <p class="sub">Nauka do egzaminu teoretycznego: od podstaw do zagadnień złożonych.</p>
      <div class="mode-grid">
        <a class="card-box mode" href="#poziom-1"><div class="big">🧭</div><b>Nauka od podstaw</b><div class="level-desc">Poziomy po kolei: teoria + fiszki</div></a>
        <a class="card-box mode" href="#losowy"><div class="big">🎲</div><b>Tryb losowy</b><div class="level-desc">Wymieszane fiszki ze wszystkich działów</div></a>
        <a class="card-box mode" href="#egzamin"><div class="big">📝</div><b>Egzamin próbny</b><div class="level-desc">75 pytań, 120 min, próg 65 – oraz testy z działów i zadanie nawigacyjne</div></a>
      </div>
      <div class="stats card-box">
        <div class="stat"><b>${allCards.length}</b>fiszek</div>
        <div class="stat"><b>${allCards.filter((c) => box(c.id) >= 2).length}</b>opanowanych</div>
        <div class="stat"><b>${mastery(allCards)}%</b>postępu</div>
      </div>
      <h2>Poziomy</h2>`;
    INDEX.levels.forEach((l) => {
      const data = LEVELS[l.level];
      if (data) {
        const cards = data.lessons.flatMap((x) => x.cards);
        const m = mastery(cards);
        html += `<a class="card-box level" href="#poziom-${l.level}">
          <div class="level-head"><div class="level-num">${l.level}</div>
          <div><div class="level-title">${esc(l.title)}</div><div class="level-desc">${esc(l.desc)}</div></div></div>
          ${progressBar(cards)}
          <div class="level-desc" style="margin-top:4px">${data.lessons.length} lekcji · ${cards.length} fiszek</div></a>`;
      } else if (l.exam) {
        html += `<a class="card-box level" href="#egzamin"><div class="level-head"><div class="level-num">${l.level}</div>
          <div><div class="level-title">${esc(l.title)}</div><div class="level-desc">${esc(l.desc)}</div></div></div>
          <div class="level-desc" style="margin-top:6px">Przejdź do egzaminów →</div></a>`;
      } else {
        html += `<div class="card-box level locked"><div class="level-head"><div class="level-num">${l.level}</div>
          <div><div class="level-title">${esc(l.title)}</div><div class="level-desc">${esc(l.desc)}</div></div></div>
          <div class="level-desc" style="margin-top:6px">W przygotowaniu</div></div>`;
      }
    });
    app.innerHTML = html;
  }

  function viewLevel(n) {
    const data = LEVELS[n];
    const meta = INDEX.levels.find((l) => l.level === n);
    if (!data) { app.innerHTML = `<p>Ten poziom jest w przygotowaniu.</p><a class="btn" href="#start">← Wróć</a>`; return; }
    let html = `<a href="#start">← Wszystkie poziomy</a><h1>Poziom ${n}: ${esc(meta.title)}</h1><p class="sub">${esc(meta.desc)}</p>
      <div class="card-box">${progressBar(data.lessons.flatMap((x) => x.cards), true)}</div>
      <h2>Lekcje</h2>`;
    data.lessons.forEach((ls, i) => {
      const m = mastery(ls.cards);
      html += `<div class="card-box"><div class="lesson-row"><div>
          <div class="level-title">${n}.${i + 1} ${esc(ls.title)}</div>
          <div class="meta">${ls.cards.length} fiszek</div></div>
          <span class="pill">${m >= 80 ? '✔ opanowana' : dist(ls.cards).fresh < ls.cards.length ? 'w trakcie' : 'nowa'}</span></div>
        ${progressBar(ls.cards)}
        <div class="btn-row"><a class="btn" href="#lekcja-${ls.id}">📖 Teoria</a>
          <a class="btn primary" href="#fiszki-${ls.id}">🃏 Fiszki</a></div></div>`;
    });
    const next = INDEX.levels.find((l) => l.level === n + 1 && LEVELS[l.level]);
    if (next) html += `<a class="btn" href="#poziom-${n + 1}">Następny poziom →</a>`;
    app.innerHTML = html;
  }

  function viewLesson(id) {
    const ls = findLesson(id);
    if (!ls) { location.hash = '#start'; return; }
    app.innerHTML = `<a href="#poziom-${ls.level}">← Poziom ${ls.level}</a>
      <h1>${esc(ls.title)}</h1>
      <div class="card-box theory">${ls.theory.map(theoryBlock).join('')}</div>
      <div class="btn-row"><a class="btn primary" href="#fiszki-${ls.id}">Przejdź do fiszek (${ls.cards.length}) →</a></div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- sesja fiszek ---------- */
  let session = null;
  function startSession(cards, title, backHref, meta) {
    session = { original: cards.slice(), queue: cards.slice(), done: 0, total: cards.length, stats: { ok: 0, mid: 0, bad: 0 }, title, backHref, revealed: false,
      meta: meta || {}, startedAt: new Date().toISOString(), saved: false };
    renderCard();
  }
  function renderCard() {
    const s = session;
    if (!s.queue.length) return renderSummary();
    const c = s.queue[0];
    const back = s.revealed;
    const aVis = c.aVisual || c.qVisual;
    app.innerHTML = `<a href="${s.backHref}">← ${esc(s.title)}</a>
      <div class="progress-line" style="margin-top:8px"><span>Ukończone ${s.done} / ${s.total}</span><span>${c.lessonTitle && c.lessonTitle !== s.title ? esc(c.lessonTitle) : ''}</span></div>
      <div class="bar" style="margin-bottom:12px"><span style="width:${Math.round(100 * s.done / s.total)}%"></span></div>
      <div class="card-box flash">
        ${c.isTask ? '<div class="task-badge">🧮 Zadanie – policz na kartce, potem sprawdź</div>' : ''}
        <div class="q">${md(c.q)}</div>
        ${!back && c.qVisual ? V.render(c.qVisual) : ''}
        ${back ? `${aVis ? V.render(aVis) : ''}
          <div class="a">${md(c.a)}</div>
          ${c.explain ? `<p class="explain">${md(c.explain)}</p>` : ''}
          ${c.tip ? `<div class="tip">${md(c.tip)}</div>` : ''}
          ${c.source ? `<div class="source">Źródło: ${esc(c.source)}</div>` : ''}` : ''}
      </div>
      ${back
        ? `<div class="btn-row grade">
            <button class="btn bad" data-g="bad">✗ Nie wiem</button>
            <button class="btn mid" data-g="mid">~ Prawie</button>
            <button class="btn ok" data-g="ok">✓ Wiem</button></div>`
        : `<div class="btn-row"><button class="btn primary" id="reveal" style="flex:1">Pokaż odpowiedź</button></div>`}`;
    const rv = document.getElementById('reveal');
    if (rv) rv.onclick = () => { s.revealed = true; renderCard(); };
    app.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => answer(b.dataset.g); });
  }
  function answer(g) {
    const s = session;
    const c = s.queue.shift();
    grade(c.id, g);
    s.stats[g] += 1;
    s.revealed = false;
    if (g === 'bad') s.queue.splice(Math.min(3, s.queue.length), 0, c);  // wróci za chwilę
    else if (g === 'mid') s.queue.push(c);                                 // wróci na koniec
    else s.done += 1;
    renderCard();
    window.scrollTo(0, 0);
  }
  function renderSummary() {
    const s = session;
    if (!s.saved && Cloud.user) {
      s.saved = true;
      Cloud.queueSession({ mode: s.meta.mode || 'lekcja', title: s.title, lesson_id: s.meta.lessonId || null,
        started_at: s.startedAt, finished_at: new Date().toISOString(), total: s.total, ok: s.stats.ok, mid: s.stats.mid, bad: s.stats.bad });
    }
    app.innerHTML = `<h1>Koniec sesji 🎉</h1>
      <p class="sub">${esc(s.title)}</p>
      <div class="stats card-box">
        <div class="stat"><b>${s.total}</b>fiszek</div>
        <div class="stat"><b>${s.stats.bad}</b>powtórek „nie wiem”</div>
        <div class="stat"><b>${s.stats.mid}</b>„prawie”</div>
      </div>
      <div class="btn-row"><a class="btn" href="${s.backHref}">← Wróć</a>
        <button class="btn primary" id="again">Powtórz jeszcze raz</button></div>`;
    document.getElementById('again').onclick = () => startSession(shuffle(s.original), s.title, s.backHref, s.meta);
  }
  // fiszki-zadania (gen) dostają przy każdej sesji nowe, losowe dane
  function lessonCards(ls) {
    return ls.cards.map((c) => {
      const base = { ...c, lessonTitle: ls.title };
      if (c.gen && window.Generators) Object.assign(base, window.Generators.make(c.gen), { isTask: true });
      return base;
    });
  }

  function viewCards(id) {
    const ls = findLesson(id);
    if (!ls) { location.hash = '#start'; return; }
    startSession(lessonCards(ls), ls.title, `#poziom-${ls.level}`, { mode: 'lekcja', lessonId: ls.id });
  }

  /* ---------- tryb losowy ---------- */
  function viewRandomSetup() {
    const avail = INDEX.levels.filter((l) => LEVELS[l.level]);
    app.innerHTML = `<a href="#start">← Start</a><h1>Tryb losowy</h1>
      <p class="sub">Fiszki wymieszane ze wszystkich wybranych poziomów. Częściej pojawiają się te, których jeszcze nie umiesz.</p>
      <div class="card-box opts">
        <b>Poziomy</b><div>${avail.map((l) => `<label><input type="checkbox" name="lv" value="${l.level}" checked> ${l.level}. ${esc(l.title)}</label>`).join('')}</div>
        <hr class="divider"><b>Liczba fiszek</b><div>
          ${[10, 20, 40].map((n, i) => `<label><input type="radio" name="n" value="${n}" ${i === 1 ? 'checked' : ''}> ${n}</label>`).join('')}
          <label><input type="radio" name="n" value="0"> wszystkie</label></div>
        <hr class="divider"><label><input type="checkbox" id="onlyWeak"> tylko nieopanowane</label>
        <div class="btn-row"><button class="btn primary" id="go">Start →</button></div>
      </div>`;
    document.getElementById('go').onclick = () => {
      const lv = [...app.querySelectorAll('input[name=lv]:checked')].map((i) => +i.value);
      const n = +app.querySelector('input[name=n]:checked').value;
      const weak = document.getElementById('onlyWeak').checked;
      let pool = lv.flatMap((x) => LEVELS[x].lessons.flatMap(lessonCards));
      if (weak) pool = pool.filter((c) => box(c.id) < 2);
      if (!pool.length) { document.getElementById('go').insertAdjacentHTML('afterend', '<p class="err">Brak fiszek dla wybranych ustawień.</p>'); return; }
      // ważenie: nowe i słabe częściej
      const weighted = shuffle(pool).map((c) => ({ c, w: Math.random() * (4 - Math.max(box(c.id), 0)) }))
        .sort((a, b) => b.w - a.w).map((x) => x.c);
      const pick = shuffle(n ? weighted.slice(0, n) : weighted);
      startSession(pick, 'Tryb losowy', '#losowy', { mode: 'losowy' });
    };
  }

  /* ---------- konto: logowanie, historia, ustawienia ---------- */
  function renderNav() {
    const nav = document.getElementById('topnav');
    if (!nav) return;
    if (Cloud.enabled && !Cloud.user) { nav.innerHTML = ''; return; }
    nav.innerHTML = `<a href="#start">Nauka</a><a href="#losowy">Losowo</a>`
      + (Cloud.user ? `<a href="#historia">Historia</a><a href="#konto" class="who" title="Moje konto">👤 ${esc(Cloud.user.name)}</a>` : '');
  }

  function viewLogin(msg) {
    renderNav();
    app.innerHTML = `<div class="login card-box">
      <h1>Zaloguj się</h1>
      <p class="sub">Każdy członek rodziny ma własny postęp i historię nauki.</p>
      <form id="loginForm" novalidate>
        <label for="login">Imię</label>
        <input id="login" name="login" autocomplete="username" autocapitalize="none" required placeholder="np. Iga">
        <label for="pw">Hasło</label>
        <input id="pw" name="pw" type="password" autocomplete="current-password" required>
        <p class="err" id="loginErr" ${msg ? '' : 'hidden'}>${esc(msg || '')}</p>
        <button class="btn primary" type="submit" id="loginBtn" style="width:100%">Zaloguj</button>
      </form></div>`;
    const f = document.getElementById('loginForm');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const err = document.getElementById('loginErr');
      const btn = document.getElementById('loginBtn');
      err.hidden = true; btn.disabled = true; btn.textContent = 'Logowanie…';
      try {
        await Cloud.signIn(f.login.value, f.pw.value);
        await syncProgress();
        renderNav();
        if (!location.hash || location.hash === '#start') route(); else location.hash = '#start';
      } catch (ex) {
        err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Zaloguj';
      }
    };
    document.getElementById('login').focus();
  }

  const fmtDate = (iso) => new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dayKey = (d) => d.toLocaleDateString('sv-SE');
  function streak(sessions) {
    const days = new Set(sessions.map((x) => dayKey(new Date(x.finished_at))));
    let n = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // dziś jeszcze nie ćwiczono – liczymy od wczoraj
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  async function viewHistory() {
    app.innerHTML = `<a href="#start">← Start</a><h1>Moja historia</h1><p class="sub">Wczytywanie…</p>`;
    let list = [];
    let offline = false;
    try { list = await Cloud.loadSessions(200); } catch (e) { offline = true; }
    list = Cloud.pendingSessions().slice().reverse().concat(list);
    const allCards = allLessons().flatMap((l) => l.cards);
    const week = list.filter((x) => Date.now() - Date.parse(x.finished_at) < 7 * 864e5);
    const answers = list.reduce((a, x) => a + x.ok + x.mid + x.bad, 0);
    const good = list.reduce((a, x) => a + x.ok, 0);
    let html = `<a href="#start">← Start</a><h1>Moja historia</h1>
      <p class="sub">${esc(Cloud.user.name)} · postęp zapisywany w chmurze${offline ? ' · <b>brak połączenia – pokazuję tylko zapisane lokalnie</b>' : ''}</p>
      <div class="stats card-box">
        <div class="stat"><b>${streak(list)}</b>dni z rzędu</div>
        <div class="stat"><b>${week.length}</b>sesji w 7 dni</div>
        <div class="stat"><b>${answers ? Math.round(100 * good / answers) : 0}%</b>odpowiedzi „wiem”</div>
      </div>
      <div class="card-box">${progressBar(allCards, true)}</div>
      <h2>Postęp w poziomach</h2><div class="card-box">`;
    INDEX.levels.filter((l) => LEVELS[l.level]).forEach((l) => {
      html += `<div class="hist-level"><b>${l.level}. ${esc(l.title)}</b>${progressBar(LEVELS[l.level].lessons.flatMap((x) => x.cards))}</div>`;
    });
    html += `</div><h2>Ostatnie sesje</h2>`;
    if (!list.length) html += `<div class="card-box"><p>Nie masz jeszcze ukończonych sesji. Ukończ pierwszą lekcję fiszek – pojawi się tutaj.</p><a class="btn primary" href="#poziom-1">Zacznij od poziomu 1 →</a></div>`;
    else {
      html += `<div class="card-box hist-list">` + list.slice(0, 100).map((x) => {
        const n = x.ok + x.mid + x.bad;
        const pct = n ? Math.round(100 * x.ok / n) : 0;
        const mins = Math.max(1, Math.round((Date.parse(x.finished_at) - Date.parse(x.started_at)) / 60000));
        return `<div class="hist-row"><div class="hist-main"><div class="level-title">${esc(x.title)}</div>
          <div class="meta">${fmtDate(x.finished_at)} · ${({ losowy: 'losowo', lekcja: 'lekcja', egzamin: 'egzamin', test: 'test', zadanie: 'zadanie nawigacyjne' })[x.mode] || x.mode} · ${x.total} ${x.mode === 'lekcja' || x.mode === 'losowy' ? 'fiszek' : 'pytań'} · ${mins} min</div></div>
          <div class="hist-score" title="wiem / prawie / nie wiem"><span class="g-ok">${x.ok}</span> <span class="g-mid">${x.mid}</span> <span class="g-bad">${x.bad}</span><small>${pct}% od razu</small></div></div>`;
      }).join('') + `</div>`;
    }
    app.innerHTML = html;
  }

  function viewAccount() {
    app.innerHTML = `<a href="#start">← Start</a><h1>Moje konto</h1>
      <div class="card-box"><p>Zalogowano jako <b>${esc(Cloud.user.name)}</b>. Postęp i historia są zapisywane w chmurze i widoczne na każdym urządzeniu po zalogowaniu.</p>
        <button class="btn" id="logout">Wyloguj</button></div>
      <div class="card-box"><h2 style="margin-top:0">Zmień hasło</h2>
        <form id="pwForm" novalidate>
          <label for="pw1">Nowe hasło (co najmniej 6 znaków)</label>
          <input id="pw1" type="password" autocomplete="new-password" minlength="6" required>
          <label for="pw2">Powtórz nowe hasło</label>
          <input id="pw2" type="password" autocomplete="new-password" minlength="6" required>
          <p class="err" id="pwMsg" hidden></p>
          <button class="btn primary" type="submit">Zapisz nowe hasło</button>
        </form></div>`;
    document.getElementById('logout').onclick = async () => { await Cloud.flush(); await Cloud.signOut(); progress = {}; session = null; location.hash = '#start'; viewLogin(); };
    const f = document.getElementById('pwForm');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const m = document.getElementById('pwMsg');
      const a = document.getElementById('pw1').value, b = document.getElementById('pw2').value;
      m.className = 'err';
      if (a.length < 6) { m.textContent = 'Hasło musi mieć co najmniej 6 znaków.'; m.hidden = false; return; }
      if (a !== b) { m.textContent = 'Hasła się różnią.'; m.hidden = false; return; }
      try { await Cloud.changePassword(a); m.className = 'okmsg'; m.textContent = 'Hasło zmienione.'; f.reset(); }
      catch (ex) { m.textContent = ex.message; }
      m.hidden = false;
    };
  }


  /* ---------- EGZAMINY: symulacja, testy z działów, zadanie nawigacyjne ---------- */
  const EXAM_KEY = () => `sm-exam-v1-${Cloud.user ? Cloud.user.id : 'local'}`;
  const EXAM_PLAN = { 1: 8, 2: 14, 3: 16, 4: 12, 5: 9, 6: 10, 7: 6 }; // 75 pytań – rozkład wg działów
  const LETTERS = ['A', 'B', 'C', 'D'];
  let exam = null;
  let examTimer = null;

  // pula pytań testowych dla poziomu: fiszki z przygotowanymi odpowiedziami, grupy obrazkowe i zadania
  function questionPool(level) {
    const data = LEVELS[level];
    if (!data) return [];
    const byQ = {};
    allLessons().forEach((ls) => ls.cards.forEach((c) => { if (!c.gen) (byQ[c.q] = byQ[c.q] || new Set()).add(c.a); }));
    const out = [];
    data.lessons.forEach((ls) => ls.cards.forEach((c) => {
      const base = { id: c.id, level, lessonTitle: ls.title, q: c.q, qVisual: c.qVisual, explain: c.explain, tip: c.tip, source: c.source };
      if (c.gen) { out.push({ ...base, gen: c.gen }); return; }
      const m = MC[level] && MC[level][c.id];
      if (m && m.wrong && m.wrong.length >= 3) { out.push({ ...base, correct: m.correct, wrong: m.wrong.slice(0, 3) }); return; }
      const group = byQ[c.q] ? [...byQ[c.q]].filter((x) => x !== c.a) : [];
      if (group.length >= 3) out.push({ ...base, correct: c.a, wrong: shuffle(group).slice(0, 3) });
    }));
    return out;
  }
  function materialize(q) {
    let item = q;
    if (q.gen && window.Generators) {
      const t = window.Generators.make(q.gen);
      item = { ...q, q: t.q, correct: t.mc.correct, wrong: t.mc.wrong, explain: t.explain, tip: t.tip, isTask: true };
    }
    const options = shuffle([item.correct, ...item.wrong]);
    return { ...item, options, correctIdx: options.indexOf(item.correct), answer: null };
  }
  function buildExam(mode, levels, count) {
    let picked = [];
    if (mode === 'egzamin') {
      const pools = {}; Object.keys(EXAM_PLAN).forEach((l) => { pools[l] = shuffle(questionPool(+l)); });
      let missing = 0;
      Object.entries(EXAM_PLAN).forEach(([l, n]) => { const take = pools[l].splice(0, n); picked.push(...take); missing += n - take.length; });
      const rest = shuffle(Object.values(pools).flat());
      picked.push(...rest.slice(0, missing));
    } else {
      const pool = shuffle(levels.flatMap(questionPool));
      picked = count ? pool.slice(0, count) : pool;
    }
    picked.sort((a, b) => a.level - b.level);
    return {
      mode, levels, questions: picked.map(materialize), idx: 0, startedAt: new Date().toISOString(),
      deadline: mode === 'egzamin' ? Date.now() + 120 * 60000 : null, finished: false, showGrid: false
    };
  }
  function saveExam() { try { if (exam && !exam.finished) localStorage.setItem(EXAM_KEY(), JSON.stringify(exam)); else localStorage.removeItem(EXAM_KEY()); } catch (e) { /* trudno */ } }
  function loadSavedExam() { try { return JSON.parse(localStorage.getItem(EXAM_KEY()) || 'null'); } catch (e) { return null; } }

  function viewExam(sub) {
    clearInterval(examTimer);
    if (sub === 'nawigacja') return viewNavTask();
    if (sub === 'trwa' && exam && !exam.finished) return renderExamQ();
    const saved = loadSavedExam();
    const avail = INDEX.levels.filter((l) => LEVELS[l.level]);
    const poolSize = avail.reduce((a, l) => a + questionPool(l.level).length, 0);
    app.innerHTML = `<a href="#start">← Start</a><h1>Egzaminy próbne</h1>
      <p class="sub">Pytania jednokrotnego wyboru ułożone z całego materiału (${poolSize} pytań w bazie, zadania obliczeniowe za każdym razem z nowymi liczbami).</p>
      ${saved ? `<div class="card-box resume"><b>Masz niedokończony ${saved.mode === 'egzamin' ? 'egzamin' : 'test'}</b>
        <div class="meta">${saved.questions.filter((q) => q.answer !== null).length} / ${saved.questions.length} odpowiedzi${saved.deadline ? ` · zostało ${Math.max(0, Math.round((saved.deadline - Date.now()) / 60000))} min` : ''}</div>
        <div class="btn-row"><button class="btn primary" id="resume">Wznów</button><button class="btn" id="discard">Porzuć</button></div></div>` : ''}
      <div class="card-box"><h2 style="margin-top:0">📝 Symulacja egzaminu</h2>
        <p>Jak na prawdziwym egzaminie: <b>75 pytań</b>, <b>120 minut</b>, zdajesz przy <b>65 poprawnych</b> odpowiedziach. Pytania ze wszystkich działów w proporcjach zbliżonych do egzaminu.</p>
        <button class="btn primary" id="full">Rozpocznij egzamin</button></div>
      <div class="card-box opts"><h2 style="margin-top:0">🎯 Test z wybranych działów</h2>
        <div>${avail.map((l) => `<label><input type="checkbox" name="tlv" value="${l.level}" ${l.level <= 3 ? 'checked' : ''}> ${l.level}. ${esc(l.title)}</label>`).join('')}</div>
        <hr class="divider"><b>Liczba pytań</b><div>${[10, 20, 40].map((n, i) => `<label><input type="radio" name="tn" value="${n}" ${i === 1 ? 'checked' : ''}> ${n}</label>`).join('')}<label><input type="radio" name="tn" value="0"> wszystkie</label></div>
        <p class="err" id="tErr" hidden>Zaznacz co najmniej jeden dział.</p>
        <div class="btn-row"><button class="btn primary" id="topic">Rozpocznij test</button></div></div>
      <div class="card-box"><h2 style="margin-top:0">🧭 Zadanie nawigacyjne</h2>
        <p>4 obliczenia jak w części nawigacyjnej egzaminu (kurs kompasowy, namiar, zliczenie, dryf). Wpisujesz wyniki, aplikacja je sprawdza i pokazuje rozwiązanie.</p>
        <a class="btn primary" href="#egzamin-nawigacja">Rozwiąż zadanie</a></div>`;
    const start = (e) => { exam = e; saveExam(); location.hash = '#egzamin-trwa'; if (location.hash === '#egzamin-trwa') renderExamQ(); };
    document.getElementById('full').onclick = () => start(buildExam('egzamin'));
    document.getElementById('topic').onclick = () => {
      const lv = [...app.querySelectorAll('input[name=tlv]:checked')].map((i) => +i.value);
      if (!lv.length) { document.getElementById('tErr').hidden = false; return; }
      start(buildExam('test', lv, +app.querySelector('input[name=tn]:checked').value));
    };
    if (saved) {
      document.getElementById('resume').onclick = () => { exam = saved; start(exam); };
      document.getElementById('discard').onclick = () => { exam = null; try { localStorage.removeItem(EXAM_KEY()); } catch (e) { /* */ } viewExam(); };
    }
  }

  const mmss = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  function tickTimer() {
    const el = document.getElementById('timer');
    if (!exam || exam.finished || !exam.deadline) return;
    const left = exam.deadline - Date.now();
    if (left <= 0) { finishExam(true); return; }
    if (el) { el.textContent = '⏱ ' + mmss(left); el.classList.toggle('low', left < 10 * 60000); }
  }
  function renderExamQ() {
    const e = exam; const q = e.questions[e.idx]; const n = e.questions.length;
    const answered = e.questions.filter((x) => x.answer !== null).length;
    app.innerHTML = `<div class="exam-top"><span>${e.mode === 'egzamin' ? 'Egzamin próbny' : 'Test'} · pytanie <b>${e.idx + 1}</b> / ${n}</span>
        ${e.deadline ? `<span id="timer" class="timer"></span>` : ''}</div>
      <div class="bar" style="margin-bottom:12px"><span style="width:${Math.round(100 * answered / n)}%"></span></div>
      <div class="card-box exam-q">
        ${q.isTask ? '<div class="task-badge">🧮 Zadanie obliczeniowe</div>' : ''}
        <div class="q">${md(q.q)}</div>
        ${q.qVisual ? V.render(q.qVisual) : ''}
        <div class="opts-list" role="radiogroup">${q.options.map((o, i) => `<button class="opt${q.answer === i ? ' sel' : ''}" data-i="${i}" role="radio" aria-checked="${q.answer === i}"><span class="ltr">${LETTERS[i]}</span><span>${md(o)}</span></button>`).join('')}</div>
      </div>
      <div class="btn-row nav-row"><button class="btn" id="prev" ${e.idx === 0 ? 'disabled' : ''}>← Wstecz</button>
        <button class="btn" id="grid">☰ ${answered}/${n}</button>
        ${e.idx < n - 1 ? '<button class="btn primary" id="next">Dalej →</button>' : '<button class="btn primary" id="end">Zakończ</button>'}</div>
      ${e.showGrid ? `<div class="card-box qgrid">${e.questions.map((x, i) => `<button class="qn${x.answer !== null ? ' done' : ''}${i === e.idx ? ' cur' : ''}" data-q="${i}">${i + 1}</button>`).join('')}</div>` : ''}
      <div class="btn-row"><button class="btn bad" id="finish">Zakończ i sprawdź wynik</button></div>
      <p class="err" id="finConfirm" hidden></p>`;
    app.querySelectorAll('.opt').forEach((b) => { b.onclick = () => { q.answer = +b.dataset.i; saveExam(); renderExamQ(); }; });
    const go = (i) => { e.idx = i; saveExam(); renderExamQ(); window.scrollTo(0, 0); };
    document.getElementById('prev').onclick = () => go(e.idx - 1);
    const nx = document.getElementById('next'); if (nx) nx.onclick = () => go(e.idx + 1);
    const en = document.getElementById('end'); if (en) en.onclick = () => askFinish();
    document.getElementById('grid').onclick = () => { e.showGrid = !e.showGrid; renderExamQ(); };
    app.querySelectorAll('.qn').forEach((b) => { b.onclick = () => go(+b.dataset.q); });
    document.getElementById('finish').onclick = () => askFinish();
    clearInterval(examTimer); if (e.deadline) { tickTimer(); examTimer = setInterval(tickTimer, 1000); }
  }
  function askFinish() {
    const left = exam.questions.filter((x) => x.answer === null).length;
    const p = document.getElementById('finConfirm');
    if (left && p.hidden) {
      p.hidden = false;
      p.innerHTML = `Bez odpowiedzi: ${left}. Kliknij jeszcze raz „Zakończ i sprawdź wynik”, aby zakończyć.`;
      return;
    }
    finishExam(false);
  }
  function finishExam(timeUp) {
    clearInterval(examTimer);
    const e = exam; e.finished = true; e.timeUp = timeUp; e.finishedAt = new Date().toISOString();
    const ok = e.questions.filter((q) => q.answer === q.correctIdx).length;
    const n = e.questions.length;
    // błędne odpowiedzi wracają do powtórek
    e.questions.forEach((q) => { if (q.answer !== q.correctIdx && !q.gen) grade(q.id, 'bad'); });
    if (Cloud.user) {
      Cloud.queueSession({ mode: e.mode, title: e.mode === 'egzamin' ? `Egzamin próbny – ${ok}/${n} ${ok >= 65 ? '✔ zdany' : '✘ niezdany'}` : `Test (poziomy ${e.levels.join(', ')}) – ${ok}/${n}`,
        lesson_id: null, started_at: e.startedAt, finished_at: e.finishedAt, total: n, ok, mid: 0, bad: n - ok });
    }
    saveExam();
    renderExamResult();
  }
  function renderExamResult() {
    const e = exam; const n = e.questions.length;
    const ok = e.questions.filter((q) => q.answer === q.correctIdx).length;
    const pass = e.mode === 'egzamin' ? ok >= 65 : ok / n >= 65 / 75;
    const byLevel = {};
    e.questions.forEach((q) => { const b = byLevel[q.level] = byLevel[q.level] || { ok: 0, n: 0 }; b.n++; if (q.answer === q.correctIdx) b.ok++; });
    const wrong = e.questions.filter((q) => q.answer !== q.correctIdx);
    app.innerHTML = `<h1>${pass ? 'Zdany ✔' : 'Niezdany ✘'}</h1>
      <p class="sub">${e.mode === 'egzamin' ? 'Egzamin próbny' : 'Test'}${e.timeUp ? ' · koniec czasu' : ''} · próg ${e.mode === 'egzamin' ? '65/75' : '87%'}</p>
      <div class="stats card-box ${pass ? 'pass' : 'fail'}">
        <div class="stat"><b>${ok}/${n}</b>poprawnych</div>
        <div class="stat"><b>${Math.round(100 * ok / n)}%</b>wyniku</div>
        <div class="stat"><b>${mmss(Date.parse(e.finishedAt) - Date.parse(e.startedAt))}</b>czas</div>
      </div>
      <h2>Wynik w działach</h2><div class="card-box">${Object.entries(byLevel).map(([l, b]) => {
        const meta = INDEX.levels.find((x) => x.level === +l);
        const pct = Math.round(100 * b.ok / b.n);
        return `<div class="lvl-score"><span>${l}. ${esc(meta ? meta.title : '')}</span><b class="${pct >= 87 ? 'g-ok' : pct >= 60 ? 'g-mid' : 'g-bad'}">${b.ok}/${b.n}</b></div>`;
      }).join('')}</div>
      <h2>Błędy do przejrzenia (${wrong.length})</h2>
      ${wrong.length ? `<p class="sub">Te pytania trafiły do powtórek – w trybie losowym z opcją „tylko nieopanowane” pojawią się w pierwszej kolejności.</p>` : '<div class="card-box">Bez błędów – brawo! ⚓</div>'}
      ${wrong.map((q) => `<div class="card-box review">
        <div class="meta">Pytanie ${e.questions.indexOf(q) + 1} · ${esc(q.lessonTitle || '')}</div>
        <div class="q">${md(q.q)}</div>${q.qVisual ? V.render(q.qVisual) : ''}
        ${q.answer !== null ? `<p class="your">✘ Twoja odpowiedź: ${md(q.options[q.answer])}</p>` : '<p class="your">✘ Brak odpowiedzi</p>'}
        <p class="right">✔ Poprawna: ${md(q.options[q.correctIdx])}</p>
        ${q.explain ? `<p class="explain">${md(q.explain)}</p>` : ''}${q.tip ? `<div class="tip">${md(q.tip)}</div>` : ''}</div>`).join('')}
      <div class="btn-row"><a class="btn primary" href="#egzamin">Kolejny egzamin / test</a><a class="btn" href="#start">Start</a></div>`;
    window.scrollTo(0, 0);
  }

  // zadanie nawigacyjne: 4 obliczenia z polami na wyniki
  let navTask = null;
  function viewNavTask() {
    const pick = (kind) => { let t; do { t = window.Generators.make(kind); } while (!t.num); return { kind, ...t }; };
    if (!navTask || navTask.checked) navTask = { items: ['kompas-kk', 'namiar', 'zliczenie', 'dryf'].map(pick), checked: false, startedAt: new Date().toISOString() };
    const parse = (v) => parseFloat(String(v).replace(',', '.').replace(/[^\d.-]/g, ''));
    const render = () => {
      app.innerHTML = `<a href="#egzamin">← Egzaminy</a><h1>Zadanie nawigacyjne</h1>
        <p class="sub">Policz na kartce i wpisz wyniki. Kąty w stopniach (całe), odległości i prędkości z dokładnością do 0,1.</p>
        <form id="navForm" novalidate>${navTask.items.map((t, i) => `<div class="card-box nav-item">
          <div class="meta">Obliczenie ${i + 1} z ${navTask.items.length}</div><div class="q">${md(t.q)}</div>
          ${t.num.map((f, j) => {
            const res = t.res && t.res[j];
            return `<label for="n${i}_${j}">${esc(f.label)} [${esc(f.unit)}]</label>
              <input id="n${i}_${j}" inputmode="decimal" autocomplete="off" value="${t.val && t.val[j] !== undefined ? esc(t.val[j]) : ''}" ${navTask.checked ? 'disabled' : ''} class="${res === true ? 'ok' : res === false ? 'bad' : ''}">
              ${navTask.checked ? `<p class="${res ? 'okmsg' : 'err'}">${res ? '✔ dobrze' : '✘ poprawnie: ' + (f.circ ? String(Math.round(f.value)).padStart(3, '0') : String(Math.round(f.value * 100) / 100).replace('.', ',')) + ' ' + esc(f.unit)}</p>` : ''}`;
          }).join('')}
          ${navTask.checked ? `<details><summary>Rozwiązanie</summary><p class="explain">${md(t.explain)}</p></details>` : ''}</div>`).join('')}
        <div class="btn-row">${navTask.checked ? '<a class="btn primary" href="#egzamin-nawigacja" id="again">Nowe zadanie</a><a class="btn" href="#egzamin">Egzaminy</a>' : '<button class="btn primary" type="submit">Sprawdź</button>'}</div></form>`;
      const f = document.getElementById('navForm');
      f.onsubmit = (ev) => {
        ev.preventDefault();
        let ok = 0, total = 0;
        navTask.items.forEach((t, i) => {
          t.val = []; t.res = [];
          t.num.forEach((fld, j) => {
            const raw = document.getElementById(`n${i}_${j}`).value; t.val[j] = raw; total++;
            const v = parse(raw);
            let good = false;
            if (!isNaN(v)) {
              if (fld.circ) { const d = Math.abs(((v - fld.value) % 360 + 540) % 360 - 180); good = d <= 1; }
              else good = Math.abs(v - fld.value) <= Math.max(0.1, fld.value * (fld.tol || 0.05));
            }
            t.res[j] = good; if (good) ok++;
          });
        });
        navTask.checked = true;
        if (Cloud.user) Cloud.queueSession({ mode: 'zadanie', title: `Zadanie nawigacyjne – ${ok}/${total}`, lesson_id: null, started_at: navTask.startedAt, finished_at: new Date().toISOString(), total, ok, mid: 0, bad: total - ok });
        render(); window.scrollTo(0, 0);
      };
      const again = document.getElementById('again');
      if (again) again.onclick = (ev) => { ev.preventDefault(); navTask = null; viewNavTask(); window.scrollTo(0, 0); };
    };
    render();
  }

  /* ---------- routing ---------- */
  function route() {
    const h = location.hash.replace(/^#/, '');
    const i = h.indexOf('-');
    const a = i < 0 ? h : h.slice(0, i);
    const b = i < 0 ? '' : h.slice(i + 1);
    renderNav();
    if (Cloud.enabled && !Cloud.user) return viewLogin();
    if (a === 'historia' && Cloud.user) return viewHistory();
    if (a === 'egzamin') return viewExam(b);
    if (a === 'konto' && Cloud.user) return viewAccount();
    if (a === 'poziom') return viewLevel(+b);
    if (a === 'lekcja') return viewLesson(b);
    if (a === 'fiszki') return viewCards(b);
    if (a === 'losowy') return viewRandomSetup();
    return viewHome();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

  async function boot() {
    await loadAll();
    if (Cloud.enabled) {
      const u = await Cloud.restore();
      if (u) await syncProgress();
    } else {
      loadLocal();
    }
    route();
  }
  boot().catch((e) => {
    app.innerHTML = `<div class="card-box"><b>Błąd wczytywania treści.</b><p>${esc(e.message)}</p>
      <p>Jeśli otwierasz plik bezpośrednio z dysku, uruchom aplikację przez serwer (np. GitHub Pages).</p></div>`;
  });
})();
