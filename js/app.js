/* Sternik Morski – logika aplikacji (bez zewnętrznych bibliotek). */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const V = window.Visuals;
  const STORE_KEY = 'sm-progress-v1';

  /* ---------- dane ---------- */
  let INDEX = null;            // content/levels.json
  const LEVELS = {};           // numer -> dane poziomu
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
          <div class="meta">${fmtDate(x.finished_at)} · ${x.mode === 'losowy' ? 'losowo' : 'lekcja'} · ${x.total} fiszek · ${mins} min</div></div>
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

  /* ---------- routing ---------- */
  function route() {
    const h = location.hash.replace(/^#/, '');
    const i = h.indexOf('-');
    const a = i < 0 ? h : h.slice(0, i);
    const b = i < 0 ? '' : h.slice(i + 1);
    renderNav();
    if (Cloud.enabled && !Cloud.user) return viewLogin();
    if (a === 'historia' && Cloud.user) return viewHistory();
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
