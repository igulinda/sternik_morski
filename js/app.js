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

  /* ---------- postęp (localStorage) ---------- */
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { progress = {}; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* brak pamięci – działamy dalej */ } }
  const box = (id) => (progress[id] ? progress[id].box : -1); // -1 = nowa
  function grade(id, g) {
    const p = progress[id] || { box: 0, seen: 0 };
    p.seen += 1; p.last = Date.now();
    if (g === 'bad') p.box = 0; else if (g === 'mid') p.box = Math.max(1, Math.min(p.box, 1)); else p.box = Math.min(3, Math.max(p.box, 0) + 1);
    progress[id] = p; save();
  }
  function mastery(cards) {
    if (!cards.length) return 0;
    return Math.round(100 * cards.filter((c) => box(c.id) >= 2).length / cards.length);
  }

  /* ---------- pomocnicze ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
          <div class="bar"><span style="width:${m}%"></span></div>
          <div class="level-desc" style="margin-top:4px">${data.lessons.length} lekcji · ${cards.length} fiszek · ${m}% opanowane</div></a>`;
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
    let html = `<a href="#start">← Wszystkie poziomy</a><h1>Poziom ${n}: ${esc(meta.title)}</h1><p class="sub">${esc(meta.desc)}</p>`;
    data.lessons.forEach((ls, i) => {
      const m = mastery(ls.cards);
      html += `<div class="card-box"><div class="lesson-row"><div>
          <div class="level-title">${n}.${i + 1} ${esc(ls.title)}</div>
          <div class="meta">${ls.cards.length} fiszek · ${m}% opanowane</div></div>
          <span class="pill">${m >= 80 ? '✔ opanowane' : m > 0 ? 'w trakcie' : 'nowa'}</span></div>
        <div class="bar"><span style="width:${m}%"></span></div>
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
  function startSession(cards, title, backHref) {
    session = { original: cards.slice(), queue: cards.slice(), done: 0, total: cards.length, stats: { ok: 0, mid: 0, bad: 0 }, title, backHref, revealed: false };
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
    app.innerHTML = `<h1>Koniec sesji 🎉</h1>
      <p class="sub">${esc(s.title)}</p>
      <div class="stats card-box">
        <div class="stat"><b>${s.total}</b>fiszek</div>
        <div class="stat"><b>${s.stats.bad}</b>powtórek „nie wiem”</div>
        <div class="stat"><b>${s.stats.mid}</b>„prawie”</div>
      </div>
      <div class="btn-row"><a class="btn" href="${s.backHref}">← Wróć</a>
        <button class="btn primary" id="again">Powtórz jeszcze raz</button></div>`;
    document.getElementById('again').onclick = () => startSession(shuffle(s.original), s.title, s.backHref);
  }
  function lessonCards(ls) { return ls.cards.map((c) => ({ ...c, lessonTitle: ls.title })); }

  function viewCards(id) {
    const ls = findLesson(id);
    if (!ls) { location.hash = '#start'; return; }
    startSession(lessonCards(ls), ls.title, `#poziom-${ls.level}`);
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
      if (!pool.length) { alert('Brak fiszek dla wybranych ustawień.'); return; }
      // ważenie: nowe i słabe częściej
      const weighted = shuffle(pool).map((c) => ({ c, w: Math.random() * (4 - Math.max(box(c.id), 0)) }))
        .sort((a, b) => b.w - a.w).map((x) => x.c);
      const pick = shuffle(n ? weighted.slice(0, n) : weighted);
      startSession(pick, 'Tryb losowy', '#losowy');
    };
  }

  /* ---------- routing ---------- */
  function route() {
    const h = location.hash.replace(/^#/, '');
    const i = h.indexOf('-');
    const a = i < 0 ? h : h.slice(0, i);
    const b = i < 0 ? '' : h.slice(i + 1);
    if (a === 'poziom') return viewLevel(+b);
    if (a === 'lekcja') return viewLesson(b);
    if (a === 'fiszki') return viewCards(b);
    if (a === 'losowy') return viewRandomSetup();
    return viewHome();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

  loadAll().then(() => route()).catch((e) => {
    app.innerHTML = `<div class="card-box"><b>Błąd wczytywania treści.</b><p>${esc(e.message)}</p>
      <p>Jeśli otwierasz plik bezpośrednio z dysku, uruchom aplikację przez serwer (np. GitHub Pages).</p></div>`;
  });
})();
