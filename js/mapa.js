/* Sternik Morski – ćwiczenia na mapie (fikcyjny akwen, odwzorowanie Merkatora).
 * window.MapTrainer.mount(el, { onResult(task, ok, total) }) – rysuje ekran ćwiczeń.
 * Konwencje jak w podręczniku: KM = KK + δ, KR = KK + d + δ, NR = NK + cp, E = „+”, W = „−”.
 */
(function () {
  'use strict';
  /* ---------- akwen i odwzorowanie ---------- */
  const LAT0 = 54 + 40 / 60, LAT1 = 55 + 10 / 60, LON0 = 17, LON1 = 17 + 50 / 60;
  const S = 20, M = 82; // px na minutę długości, margines na ramkę
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 10800 / Math.PI;
  const W = (LON1 - LON0) * 60 * S + 2 * M;
  const H = (merc(LAT1) - merc(LAT0)) * S + 2 * M;
  const X = (lon) => M + (lon - LON0) * 60 * S;
  const Y = (lat) => M + (merc(LAT1) - merc(lat)) * S;
  const toLon = (x) => LON0 + (x - M) / S / 60;
  const toLat = (y) => { const m = merc(LAT1) - (y - M) / S; return (2 * Math.atan(Math.exp(m * Math.PI / 10800)) - Math.PI / 2) * 180 / Math.PI; };
  // punkt podawany jako [minuty długości od 17°00′E, minuty szerokości od 54°40′N]
  const P = (dlon, dlat) => ({ lat: LAT0 + dlat / 60, lon: LON0 + dlon / 60 });
  const DECL = 5; // deklinacja 5°E (2026)

  // nawigacja płaska (żegluga po loksodromie na małym akwenie)
  function course(a, b) {
    const lm = (a.lat + b.lat) / 2 * Math.PI / 180;
    const dn = (b.lat - a.lat) * 60, de = (b.lon - a.lon) * 60 * Math.cos(lm);
    return { brg: (Math.atan2(de, dn) * 180 / Math.PI + 360) % 360, dist: Math.hypot(dn, de) };
  }
  function dest(a, brg, dist) {
    const r = brg * Math.PI / 180;
    const lat = a.lat + dist * Math.cos(r) / 60;
    const lm = (a.lat + lat) / 2 * Math.PI / 180;
    return { lat, lon: a.lon + dist * Math.sin(r) / 60 / Math.cos(lm) };
  }
  const norm = (x) => ((x % 360) + 360) % 360;
  const deg3 = (x) => String(Math.round(norm(x)) % 360).padStart(3, '0') + '°';
  const sgn = (x) => (x > 0 ? `+${x}°` : x < 0 ? `−${-x}°` : '0°');
  const ew = (x) => (x === 0 ? '0°' : `${Math.abs(x)}°${x > 0 ? 'E' : 'W'}`);
  const num = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
  const fmtLat = (lat) => { const d = Math.floor(lat); return `${d}°${num((lat - d) * 60, 1).padStart(4, '0')}′N`; };
  const fmtLon = (lon) => { const d = Math.floor(lon); return `${String(d).padStart(3, '0')}°${num((lon - d) * 60, 1).padStart(4, '0')}′E`; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const nonzero = (a, b) => { let v = 0; while (!v) v = rint(a, b); return v; };

  /* ---------- treść mapy ---------- */
  const COAST = [[-2, 5], [3, 6.1], [7, 6.7], [9, 7.3], [10.2, 7.9], [11.4, 7.2], [14, 6.4], [18, 5.7], [23, 6], [28, 6.7], [33, 7.3], [36.6, 7.8],
    [37.4, 7.9], [39.4, 7.9], [41, 7.4], [45, 6.6], [49, 6.9], [52, 7.1], [52, -2], [-2, -2]];
  const ISLAND = [[20.6, 17.6], [21.2, 18.9], [22.6, 19.5], [24, 19.1], [24.5, 18.1], [23.6, 17.2], [21.9, 17]];
  const LIGHTS = [
    { id: 'L1', name: 'Lt Przylądek Sowi', p: P(10.2, 7.5), ch: 'Fl(3) 15s 32m 18M', dx: 10, dy: 30 },
    { id: 'L2', name: 'Lt Mewia', p: P(22.7, 18.5), ch: 'Iso 6s 24m 15M', dx: 10, dy: -14 },
    { id: 'L3', name: 'Lt Wilga (główka)', p: P(38.4, 8.7), ch: 'Oc(2) R 10s 12m 9M', dx: 10, dy: -8 }
  ];
  const BUOYS = [
    { p: P(30, 14.6), type: 'N', label: 'Q' },
    { p: P(14, 22), type: 'iso', label: 'Fl(2) 5s' },
    { p: P(38.4, 11.6), type: 'safe', label: 'Mo(A) 6s' },
    { p: P(43, 24.5), type: 'special', label: 'Fl Y 4s' }
  ];
  const SHOAL = { c: P(30, 13), rx: 2.6, ry: 1.2, depths: [[29, 13.2, '1,8'], [30.8, 12.8, '2,1'], [30, 13.6, '2,6']] };
  function soundings() {
    const out = []; let seed = 7;
    const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let la = 9; la < 30; la += 2.6) for (let lo = 1; lo < 50; lo += 3.4) {
      const dlo = lo + (r() - 0.5) * 1.5, dla = la + (r() - 0.5) * 1.2;
      const near = (q, d) => Math.hypot(dlo - q[0], dla - q[1]) < d;
      if (near([30, 13], 4) || near([22.6, 18.3], 3.4) || near([8, 25], 5.5) || near([38.4, 11.6], 1.5) || near([14, 22], 1.5) || near([43, 24.5], 1.5)) continue;
      const depth = 6 + (dla - 7) * 1.9 + r() * 4;
      out.push([dlo, dla, depth >= 20 ? String(Math.round(depth)) : num(depth, 1).replace(',0', '')]);
    }
    return out;
  }
  const SOUNDINGS = soundings();

  function mapSvg() {
    const poly = (pts) => pts.map(([lo, la]) => `${X(LON0 + lo / 60).toFixed(1)},${Y(LAT0 + la / 60).toFixed(1)}`).join(' ');
    let s = `<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" fill="var(--map-sea)"/>`;
    // izobata 10 m (orientacyjna) i ławica
    s += `<polyline points="${poly(COAST.slice(0, 18).map(([a, b]) => [a, b + 2.2]))}" fill="none" stroke="var(--map-iso)" stroke-width="1.2" stroke-dasharray="6 4"/>`;
    s += `<ellipse cx="${X(SHOAL.c.lon)}" cy="${Y(SHOAL.c.lat)}" rx="${SHOAL.rx * S}" ry="${SHOAL.ry * S * 1.74}" fill="var(--map-shoal)" stroke="var(--map-iso)" stroke-dasharray="4 3"/>`;
    s += `<text x="${X(SHOAL.c.lon)}" y="${Y(SHOAL.c.lat) + 40}" class="mt it" text-anchor="middle">Ławica Piaskowa</text>`;
    SHOAL.depths.forEach(([lo, la, d]) => { s += `<text x="${X(LON0 + lo / 60)}" y="${Y(LAT0 + la / 60)}" class="mt dep" text-anchor="middle">${d}</text>`; });
    SOUNDINGS.forEach(([lo, la, d]) => { s += `<text x="${X(LON0 + lo / 60)}" y="${Y(LAT0 + la / 60)}" class="mt dep" text-anchor="middle">${d}</text>`; });
    // ląd
    s += `<polygon points="${poly(COAST)}" fill="var(--map-land)" stroke="var(--map-coast)" stroke-width="1.6"/>`;
    s += `<polygon points="${poly(ISLAND)}" fill="var(--map-land)" stroke="var(--map-coast)" stroke-width="1.6"/>`;
    s += `<text x="${X(LON0 + 22.6 / 60)}" y="${Y(LAT0 + 17.9 / 60)}" class="mt land" text-anchor="middle">Wyspa Mewia</text>`;
    s += `<text x="${X(LON0 + 24 / 60)}" y="${Y(LAT0 + 3.2 / 60)}" class="mt landbig" text-anchor="middle">LĄD</text>`;
    // port Wilga – falochrony
    s += `<path d="M${X(LON0 + 37.6 / 60)} ${Y(LAT0 + 7.9 / 60)} L${X(LON0 + 38.1 / 60)} ${Y(LAT0 + 8.7 / 60)} M${X(LON0 + 39.4 / 60)} ${Y(LAT0 + 7.9 / 60)} L${X(LON0 + 38.7 / 60)} ${Y(LAT0 + 8.7 / 60)}" stroke="var(--map-coast)" stroke-width="5"/>`;
    s += `<text x="${X(LON0 + 38.5 / 60)}" y="${Y(LAT0 + 6.3 / 60)}" class="mt land" text-anchor="middle">Port Wilga</text>`;
    // wrak
    s += `<text x="${X(LON0 + 14 / 60) + 12}" y="${Y(LAT0 + 22 / 60) + 22}" class="mt it">wrak</text>`;
    // latarnie
    LIGHTS.forEach((l) => {
      const x = X(l.p.lon), y = Y(l.p.lat);
      s += `<path d="M${x} ${y} l-5 -22 a6 6 0 0 1 10 0 Z" fill="var(--map-light)" opacity=".9"/><circle cx="${x}" cy="${y}" r="4.5" fill="var(--map-ink)"/>`;
      s += `<text x="${x + l.dx}" y="${y + l.dy}" class="mt lt">${l.name}</text><text x="${x + l.dx}" y="${y + l.dy + 15}" class="mt lt2">${l.ch}</text>`;
    });
    // pławy
    BUOYS.forEach((b) => {
      const x = X(b.p.lon), y = Y(b.p.lat);
      const fill = { N: 'url(#bN)', iso: 'url(#bIso)', safe: 'url(#bSafe)', special: '#f5c400' }[b.type];
      s += `<path d="M${x - 6} ${y} L${x + 6} ${y} L${x + 3} ${y - 16} L${x - 3} ${y - 16} Z" fill="${fill}" stroke="var(--map-ink)" stroke-width="1"/>`;
      const top = { N: '▲▲', iso: '●●', safe: '●', special: '✕' }[b.type];
      s += `<text x="${x}" y="${y - 20}" class="mt tm" text-anchor="middle">${top}</text>`;
      s += `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--map-ink)"/><text x="${x + 9}" y="${y + 4}" class="mt lt2">${b.label}</text>`;
    });
    // róża kompasowa
    const cx = X(LON0 + 8 / 60), cy = Y(LAT0 + 25 / 60), R = 78;
    s += `<g class="rose"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--map-rose)"/><circle cx="${cx}" cy="${cy}" r="${R - 26}" fill="none" stroke="var(--map-rose)"/>`;
    for (let a = 0; a < 360; a += 5) {
      const r1 = a % 30 === 0 ? R - 12 : a % 10 === 0 ? R - 8 : R - 5;
      const rad = a * Math.PI / 180;
      s += `<line x1="${cx + R * Math.sin(rad)}" y1="${cy - R * Math.cos(rad)}" x2="${cx + r1 * Math.sin(rad)}" y2="${cy - r1 * Math.cos(rad)}" stroke="var(--map-rose)"/>`;
      if (a % 30 === 0) s += `<text x="${cx + (R + 11) * Math.sin(rad)}" y="${cy - (R + 11) * Math.cos(rad) + 4}" class="mt rs" text-anchor="middle">${a}</text>`;
      const m = (a + DECL) * Math.PI / 180, r2 = R - 26;
      if (a % 10 === 0) s += `<line x1="${cx + r2 * Math.sin(m)}" y1="${cy - r2 * Math.cos(m)}" x2="${cx + (r2 - (a % 30 ? 4 : 8)) * Math.sin(m)}" y2="${cy - (r2 - (a % 30 ? 4 : 8)) * Math.cos(m)}" stroke="var(--map-rose)"/>`;
    }
    s += `<path d="M${cx} ${cy - R + 2} l-5 12 h10 Z" fill="var(--map-rose)"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + (R - 30) * Math.sin(DECL * Math.PI / 180)}" y2="${cy - (R - 30) * Math.cos(DECL * Math.PI / 180)}" stroke="var(--map-rose)" stroke-width="1.5"/>`;
    s += `<text x="${cx}" y="${cy + 4}" class="mt rs" text-anchor="middle">${DECL}°E (2026)</text>`;
    s += `<text x="${cx}" y="${cy + 18}" class="mt rs2" text-anchor="middle">zmiana roczna 0</text></g>`;
    s = `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--map-frame)"/><g clip-path="url(#mclip)">${s}</g>`;
    // ramka: podziałka minut
    for (let m = 0; m <= 30; m++) {
      const y = Y(LAT0 + m / 60), len = m % 5 === 0 ? 14 : m % 1 === 0 ? 8 : 5;
      s += `<line x1="${M}" y1="${y}" x2="${M - len}" y2="${y}" stroke="var(--map-ink)"/><line x1="${W - M}" y1="${y}" x2="${W - M + len}" y2="${y}" stroke="var(--map-ink)"/>`;
      if (m < 30) for (let k = 1; k < 10; k++) {
        const yy = Y(LAT0 + (m + k / 10) / 60);
        s += `<line x1="${M}" y1="${yy}" x2="${M - (k === 5 ? 5 : 3)}" y2="${yy}" stroke="var(--map-ink)" stroke-width=".6"/><line x1="${W - M}" y1="${yy}" x2="${W - M + (k === 5 ? 5 : 3)}" y2="${yy}" stroke="var(--map-ink)" stroke-width=".6"/>`;
      }
      if (m % 5 === 0) {
        const lab = `${54 + Math.floor((40 + m) / 60)}°${String((40 + m) % 60).padStart(2, '0')}′`;
        s += `<text x="${M - 17}" y="${y + 4}" class="mt fr" text-anchor="end">${lab}</text><text x="${W - M + 17}" y="${y + 4}" class="mt fr">${lab}</text>`;
        s += `<line x1="${M}" y1="${y}" x2="${W - M}" y2="${y}" stroke="var(--map-grid)" stroke-width=".7"/>`;
      }
    }
    for (let m = 0; m <= 50; m++) {
      const x = X(LON0 + m / 60), len = m % 5 === 0 ? 14 : 8;
      s += `<line x1="${x}" y1="${M}" x2="${x}" y2="${M - len}" stroke="var(--map-ink)"/><line x1="${x}" y1="${H - M}" x2="${x}" y2="${H - M + len}" stroke="var(--map-ink)"/>`;
      if (m < 50) for (let k = 1; k < 10; k++) {
        const xx = X(LON0 + (m + k / 10) / 60);
        s += `<line x1="${xx}" y1="${M}" x2="${xx}" y2="${M - (k === 5 ? 5 : 3)}" stroke="var(--map-ink)" stroke-width=".6"/><line x1="${xx}" y1="${H - M}" x2="${xx}" y2="${H - M + (k === 5 ? 5 : 3)}" stroke="var(--map-ink)" stroke-width=".6"/>`;
      }
      if (m % 5 === 0) {
        const lab = `017°${String(m).padStart(2, '0')}′`;
        s += `<text x="${x}" y="${M - 20}" class="mt fr" text-anchor="middle">${lab}</text><text x="${x}" y="${H - M + 30}" class="mt fr" text-anchor="middle">${lab}</text>`;
        s += `<line x1="${x}" y1="${M}" x2="${x}" y2="${H - M}" stroke="var(--map-grid)" stroke-width=".7"/>`;
      }
    }
    s += `<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" fill="none" stroke="var(--map-ink)" stroke-width="1.5"/>`;
    s += `<g class="title"><rect x="${W - M - 330}" y="${H - M - 70}" width="320" height="60" fill="var(--map-frame)" stroke="var(--map-ink)"/>
      <text x="${W - M - 320}" y="${H - M - 48}" class="mt tt">MAPA ĆWICZEBNA – akwen fikcyjny</text>
      <text x="${W - M - 320}" y="${H - M - 30}" class="mt rs2">Nie do nawigacji. Merkator, głębokości w metrach.</text>
      <text x="${W - M - 320}" y="${H - M - 15}" class="mt rs2">Mile mierz na ramce bocznej (1′ szer. = 1 Mm).</text></g>`;
    const defs = `<defs><clipPath id="mclip"><rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}"/></clipPath>
      <linearGradient id="bN" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#151515"/><stop offset=".5" stop-color="#f5c400"/></linearGradient>
      <linearGradient id="bIso" x1="0" y1="0" x2="0" y2="1"><stop offset=".33" stop-color="#151515"/><stop offset=".33" stop-color="#d62b2b"/><stop offset=".66" stop-color="#d62b2b"/><stop offset=".66" stop-color="#151515"/></linearGradient>
      <linearGradient id="bSafe" x1="0" y1="0" x2="1" y2="0"><stop offset=".5" stop-color="#d62b2b"/><stop offset=".5" stop-color="#fff"/></linearGradient></defs>`;
    return defs + s;
  }

  /* ---------- widok mapy: przybliżanie, przesuwanie, dotknięcia ---------- */
  function createMap(holder, onTap) {
    holder.innerHTML = `<div class="map-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${mapSvg()}<g id="ov" clip-path="url(#mclip)"></g></svg>
      <div class="map-tools"><button type="button" data-z="in" aria-label="Przybliż">＋</button><button type="button" data-z="out" aria-label="Oddal">－</button><button type="button" data-z="fit" aria-label="Cała mapa">⤢</button></div></div>`;
    const svg = holder.querySelector('svg');
    const ov = svg.querySelector('#ov');
    // widok dopasowany do proporcji okna (na pionowym telefonie mapa wypełnia całą wysokość)
    let aspect = 1;
    const measure = () => { const r = svg.getBoundingClientRect(); if (r.width && r.height) aspect = r.width / r.height; };
    let vb = { x: 0, y: 0, w: W, h: H };
    const apply = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const clamp = () => {
      const maxW = Math.min(W, H * aspect);
      vb.w = Math.min(maxW, Math.max(W / 12, vb.w)); vb.h = vb.w / aspect;
      vb.x = Math.min(W - vb.w, Math.max(0, vb.x)); vb.y = Math.min(H - vb.h, Math.max(0, vb.y));
    };
    const fit = () => { measure(); vb.w = W; vb.x = 0; vb.y = 0; clamp(); vb.x = (W - vb.w) / 2; vb.y = (H - vb.h) / 2; clamp(); apply(); };
    const zoom = (f, cx, cy) => {
      cx = cx === undefined ? vb.x + vb.w / 2 : cx; cy = cy === undefined ? vb.y + vb.h / 2 : cy;
      const nw = vb.w / f; vb.x = cx - (cx - vb.x) * (nw / vb.w); vb.y = cy - (cy - vb.y) * (nw / vb.w); vb.w = nw; clamp(); apply();
    };
    // dokładne przeliczenie ekran → mapa (uwzględnia dopasowanie proporcji viewBox)
    const pt = (e) => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const r = q.matrixTransform(svg.getScreenCTM().inverse()); return { x: r.x, y: r.y }; };
    const scale = () => { const m = svg.getScreenCTM(); return m ? m.a : 1; }; // px ekranu na jednostkę mapy
    holder.querySelectorAll('[data-z]').forEach((b) => {
      b.onclick = () => { const z = b.dataset.z; if (z === 'in') zoom(1.6); else if (z === 'out') zoom(1 / 1.6); else fit(); };
    });
    const ptrs = new Map(); let moved = false, start = null, pinch = null;
    svg.addEventListener('pointerdown', (e) => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e); moved = false; start = { e, vb: { ...vb } };
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), w: vb.w }; } });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, e);
      if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const c = pt({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
        zoom(vb.w / (pinch.w * pinch.d / d), c.x, c.y); moved = true; return;
      }
      const dx = e.clientX - start.e.clientX, dy = e.clientY - start.e.clientY;
      if (Math.hypot(dx, dy) > 6) moved = true;
      if (moved) { const k = start.k || (start.k = scale()); vb.x = start.vb.x - dx / k; vb.y = start.vb.y - dy / k; clamp(); apply(); }
    });
    const up = (e) => {
      const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (was && !moved && ptrs.size === 0 && onTap) { const p = pt(e); if (p.x > M && p.x < W - M && p.y > M && p.y < H - M) onTap({ lat: toLat(p.y), lon: toLon(p.x) }); }
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', (e) => ptrs.delete(e.pointerId));
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const p = pt(e); zoom(e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y); }, { passive: false });
    const api = {
      clear(tag) { [...ov.querySelectorAll(tag ? `[data-t="${tag}"]` : '*')].forEach((n) => { if (n.parentNode === ov) n.remove(); }); },
      mark(p, opt) {
        const o = opt || {}; const x = X(p.lon), y = Y(p.lat);
        const c = o.color || 'var(--map-mark)';
        const g = `<g data-t="${o.tag || ''}"><circle cx="${x}" cy="${y}" r="${o.r || 7}" fill="none" stroke="${c}" stroke-width="2.4"/>
          <line x1="${x - 13}" y1="${y}" x2="${x + 13}" y2="${y}" stroke="${c}" stroke-width="1.4"/><line x1="${x}" y1="${y - 13}" x2="${x}" y2="${y + 13}" stroke="${c}" stroke-width="1.4"/>
          ${o.label ? `<text x="${x + 12}" y="${y - 10}" class="mt mk" fill="${c}">${o.label}</text>` : ''}</g>`;
        ov.insertAdjacentHTML('beforeend', g);
      },
      line(a, b, opt) {
        const o = opt || {}; const c = o.color || 'var(--map-mark)';
        ov.insertAdjacentHTML('beforeend', `<g data-t="${o.tag || ''}"><line x1="${X(a.lon)}" y1="${Y(a.lat)}" x2="${X(b.lon)}" y2="${Y(b.lat)}" stroke="${c}" stroke-width="${o.w || 2}" ${o.dash ? 'stroke-dasharray="8 5"' : ''}/>
          ${o.label ? `<text x="${(X(a.lon) + X(b.lon)) / 2 + 8}" y="${(Y(a.lat) + Y(b.lat)) / 2 - 8}" class="mt mk" fill="${c}">${o.label}</text>` : ''}</g>`);
      },
      focus(p, w) { measure(); vb.w = w || W / 3; clamp(); vb.x = X(p.lon) - vb.w / 2; vb.y = Y(p.lat) - vb.h / 2; clamp(); apply(); }
    };
    fit();
    window.addEventListener('resize', () => { const c = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 }; measure(); clamp(); vb.x = c.x - vb.w / 2; vb.y = c.y - vb.h / 2; clamp(); apply(); });
    return api;
  }

  /* ---------- losowe punkty na morzu ---------- */
  function inPoly(p, pts) {
    const x = (p.lon - LON0) * 60, y = (p.lat - LAT0) * 60; let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  const isSea = (p) => !inPoly(p, COAST) && !inPoly(p, ISLAND);
  function seaPoint(dlon, dlat) {
    for (let i = 0; i < 200; i++) {
      const p = P(rnd(dlon[0], dlon[1]), rnd(dlat[0], dlat[1]));
      if (isSea(p) && course(p, SHOAL.c).dist > 3 && course(p, P(8, 25)).dist > 5) return p;
    }
    return P(25, 24);
  }

  /* ---------- zadania ---------- */
  const TASKS = {
    odczyt: { title: 'Odczytaj pozycję', icon: '📍' },
    naniesienie: { title: 'Nanieś pozycję', icon: '✏️' },
    namiary: { title: 'Pozycja z dwóch namiarów', icon: '🔦' },
    zliczenie: { title: 'Zliczenie drogi', icon: '🧭' },
    kurs: { title: 'Kurs i czas przejścia', icon: '📐' }
  };

  function degMinInputs(id, label, hemi, d) {
    return `<div class="dm"><label for="${id}d">${label}</label><div class="dm-row"><input id="${id}d" inputmode="numeric" placeholder="${d}" maxlength="3"><span>°</span>
      <input id="${id}m" inputmode="decimal" placeholder="00,0"><span>′${hemi}</span></div></div>`;
  }
  const readDM = (id) => {
    const d = parseFloat(document.getElementById(id + 'd').value.replace(',', '.'));
    const m = parseFloat(document.getElementById(id + 'm').value.replace(',', '.'));
    return isNaN(d) || isNaN(m) ? NaN : d + m / 60;
  };
  const readNum = (id) => parseFloat(String(document.getElementById(id).value).replace(',', '.').replace(/[^\d.-]/g, ''));
  const angOk = (v, t, tol) => !isNaN(v) && Math.abs(((v - t) % 360 + 540) % 360 - 180) <= (tol || 1);

  function mount(el, opts) {
    const o = opts || {};
    let task = null, map = null, step = 0, ruler = null, rulerOn = false, results = [];
    function menu() {
      el.innerHTML = `<div class="map-menu">${Object.entries(TASKS).map(([k, t]) => `<button class="card-box mode map-pick" data-k="${k}"><span class="big">${t.icon}</span><b>${t.title}</b></button>`).join('')}
        <button class="card-box mode map-pick" data-k="los"><span class="big">🎲</span><b>Losowe zadanie</b></button></div>`;
      el.querySelectorAll('.map-pick').forEach((b) => { b.onclick = () => start(b.dataset.k === 'los' ? Object.keys(TASKS)[rint(0, 4)] : b.dataset.k); });
    }
    function setStatus(html, cls) { const s = el.querySelector('#mapMsg'); s.className = 'map-msg ' + (cls || ''); s.innerHTML = html; }
    function onTap(p) {
      if (rulerOn) {
        if (!ruler || ruler.b) { ruler = { a: p }; map.clear('ruler'); map.mark(p, { tag: 'ruler', color: 'var(--map-ruler)', r: 4 }); setStatus('Linijka: dotknij drugiego punktu.'); return; }
        ruler.b = p; const c = course(ruler.a, ruler.b);
        map.line(ruler.a, ruler.b, { tag: 'ruler', color: 'var(--map-ruler)', label: `${deg3(c.brg)} · ${num(c.dist, 1)} Mm` });
        setStatus(`Linijka: kierunek rzeczywisty <b>${deg3(c.brg)}</b>, odległość <b>${num(c.dist, 1)} Mm</b>.`);
        return;
      }
      if (task && task.onTap) task.onTap(p);
    }
    function frame(t) {
      el.innerHTML = `<div class="map-head"><button class="btn" id="mBack">← Zadania</button><b>${TASKS[t.kind].icon} ${TASKS[t.kind].title}</b></div>
        <div class="card-box map-task">${t.text}</div>
        <div id="mapHolder"></div>
        <div class="map-bar"><button type="button" class="btn" id="mRuler">📏 Linijka</button><span id="mapMsg" class="map-msg">Przybliżaj ＋ / szczyptą, przesuwaj palcem.</span></div>
        <form id="mForm" class="card-box map-form" novalidate>${t.form}<p class="err" id="mErr" hidden></p>
          <div class="btn-row"><button class="btn primary" type="submit" id="mCheck">Sprawdź</button></div></form>
        <div id="mRes"></div>`;
      map = createMap(el.querySelector('#mapHolder'), onTap);
      window.MapTrainer._map = map; // dostęp dla testów automatycznych
      el.querySelector('#mBack').onclick = menu;
      const rb = el.querySelector('#mRuler');
      if (t.noRuler) rb.hidden = true;
      rb.onclick = () => { rulerOn = !rulerOn; rb.classList.toggle('primary', rulerOn); ruler = null; map.clear('ruler'); setStatus(rulerOn ? 'Linijka: dotknij punktu początkowego.' : 'Linijka wyłączona.'); };
      el.querySelector('#mForm').onsubmit = (e) => { e.preventDefault(); t.check(); };
      if (t.draw) t.draw();
    }
    function finish(t, ok, total, html) {
      el.querySelector('#mCheck').disabled = true;
      el.querySelector('#mRes').innerHTML = `<div class="card-box ${ok === total ? 'map-ok' : 'map-bad'}"><b>${ok === total ? '✔ Dobrze!' : `Wynik: ${ok}/${total}`}</b>${html}
        <div class="btn-row"><button class="btn primary" id="mAgain">Następne zadanie →</button><button class="btn" id="mMenu">Lista zadań</button></div></div>`;
      el.querySelector('#mAgain').onclick = () => start(t.kind);
      el.querySelector('#mMenu').onclick = menu;
      results.push([t.kind, ok, total]);
      if (o.onResult) o.onResult(TASKS[t.kind].title, ok, total);
      el.querySelector('#mRes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const line = (ok, txt) => `<p class="${ok ? 'okmsg' : 'err'}">${ok ? '✔' : '✘'} ${txt}</p>`;

    function start(kind) {
      rulerOn = false; ruler = null; step = 0;
      const t = { kind };
      if (kind === 'odczyt') {
        const p = seaPoint([3, 47], [10, 28]);
        t.text = `Odczytaj z mapy współrzędne zaznaczonego punktu <b>A</b> (z dokładnością do 0,1′). Przybliż mapę i użyj podziałek na ramkach.`;
        t.noRuler = true;
        t.form = degMinInputs('la', 'Szerokość φ', 'N', '54') + degMinInputs('lo', 'Długość λ', 'E', '017');
        t.draw = () => { map.mark(p, { label: 'A' }); };
        t.check = () => {
          const la = readDM('la'), lo = readDM('lo');
          if (isNaN(la) || isNaN(lo)) { const e = el.querySelector('#mErr'); e.hidden = false; e.textContent = 'Uzupełnij stopnie i minuty.'; return; }
          const okLa = Math.abs(la - p.lat) * 60 <= 0.3, okLo = Math.abs(lo - p.lon) * 60 <= 0.3;
          finish(t, okLa + okLo, 2, line(okLa, `φ = ${fmtLat(p.lat)} (Twoja: ${fmtLat(la)})`) + line(okLo, `λ = ${fmtLon(p.lon)} (Twoja: ${fmtLon(lo)})`)
            + `<p class="level-desc">Dopuszczalny błąd: 0,3′. Szerokość odczytujesz na ramce bocznej, długość – na górnej/dolnej.</p>`);
        };
      } else if (kind === 'naniesienie') {
        const p = seaPoint([3, 47], [10, 28]);
        let tap = null;
        t.text = `Nanieś na mapę pozycję <b>φ = ${fmtLat(p.lat)}, λ = ${fmtLon(p.lon)}</b> – dotknij właściwego miejsca (możesz poprawiać), potem „Sprawdź”.`;
        t.noRuler = true;
        t.form = `<p class="level-desc">Wskazówka: najpierw znajdź równoleżnik na ramce bocznej, potem południk na ramce górnej.</p>`;
        t.onTap = (q) => { tap = q; map.clear('u'); map.mark(q, { tag: 'u', label: 'Twoja' }); };
        t.check = () => {
          if (!tap) { const e = el.querySelector('#mErr'); e.hidden = false; e.textContent = 'Najpierw dotknij mapy w miejscu pozycji.'; return; }
          const d = course(tap, p).dist; const ok = d <= 0.4;
          map.mark(p, { color: 'var(--map-good)', label: 'poprawna' });
          finish(t, ok ? 1 : 0, 1, line(ok, `Odległość od poprawnej pozycji: ${num(d, 2)} Mm (dopuszczalne 0,4 Mm).`));
        };
      } else if (kind === 'namiary') {
        const pos = seaPoint([4, 46], [11, 27]);
        const pair = [[0, 1], [1, 2], [0, 2]].map((ix) => ix.map((i) => LIGHTS[i])).find(([a, b]) => {
          const d = Math.abs(((course(pos, a.p).brg - course(pos, b.p).brg) % 360 + 540) % 360 - 180); return d > 40 && d < 140;
        }) || [LIGHTS[0], LIGHTS[1]];
        const dv = nonzero(-4, 4), d = DECL;
        const nr = pair.map((l) => course(pos, l.p).brg);
        const nk = nr.map((x) => norm(Math.round(x) - dv - d));
        t.text = `Kurs jachtu KK = ${deg3(rint(0, 359))}, dewiacja dla tego kursu δ = ${ew(dv)}, deklinację odczytaj z róży mapy.<br>
          Namiary kompasowe: <b>${pair[0].name}</b> NK = ${deg3(nk[0])}, <b>${pair[1].name}</b> NK = ${deg3(nk[1])}.<br>
          1) Oblicz namiary rzeczywiste. 2) Po sprawdzeniu aplikacja wykreśli je na mapie – wtedy dotknij pozycji obserwowanej (przecięcia).`;
        t.form = `<label for="nr1">NR na ${pair[0].name} [°]</label><input id="nr1" inputmode="numeric">
          <label for="nr2">NR na ${pair[1].name} [°]</label><input id="nr2" inputmode="numeric">`;
        let tap = null, okNr = 0;
        t.onTap = (q) => { if (step !== 1) return; tap = q; map.clear('u'); map.mark(q, { tag: 'u', label: 'PO?' }); setStatus('Zaznaczono – kliknij „Sprawdź”.'); };
        t.check = () => {
          if (step === 0) {
            const v = [readNum('nr1'), readNum('nr2')];
            if (v.some(isNaN)) { const e = el.querySelector('#mErr'); e.hidden = false; e.textContent = 'Wpisz oba namiary.'; return; }
            okNr = v.filter((x, i) => angOk(x, nk[i] + dv + d, 0.5)).length;
            const cp = dv + d;
            pair.forEach((l, i) => {
              const back = norm(v[i] + 180);
              map.line(l.p, dest(l.p, back, 14), { color: 'var(--map-mark)', dash: true, label: `NR ${deg3(v[i])}` });
            });
            el.querySelector('#mErr').hidden = false; el.querySelector('#mErr').className = okNr === 2 ? 'okmsg' : 'err';
            el.querySelector('#mErr').innerHTML = `${okNr === 2 ? '✔' : '✘'} cp = δ + d = ${sgn(dv)} ${sgn(d)} = ${sgn(cp)}; NR = NK + cp → ${deg3(nk[0] + cp)} i ${deg3(nk[1] + cp)}. Linie wykreślono z Twoich wartości – teraz dotknij przecięcia i „Sprawdź”.`;
            step = 1; el.querySelector('#mCheck').textContent = 'Sprawdź pozycję';
            return;
          }
          if (!tap) { setStatus('Dotknij przecięcia linii namiarów.', 'bad'); return; }
          const dd = course(tap, pos).dist; const okP = dd <= 0.4;
          pair.forEach((l, i) => map.line(l.p, pos, { color: 'var(--map-good)', w: 1.4 }));
          map.mark(pos, { color: 'var(--map-good)', label: 'PO' });
          finish(t, okNr + (okP ? 1 : 0), 3, `<p>${okNr}/2 namiary poprawne.</p>` + line(okP, `Pozycja: ${fmtLat(pos.lat)} ${fmtLon(pos.lon)} – Twoja różni się o ${num(dd, 2)} Mm.`)
            + `<p class="level-desc">Namiar wykreśla się od latarni w kierunku NR ± 180°.</p>`);
        };
      } else if (kind === 'zliczenie') {
        let s0, kr, dist, end, tries = 0;
        do { s0 = seaPoint([5, 40], [10, 26]); kr = rint(0, 359); dist = rint(16, 50) / 4; end = dest(s0, kr, dist); tries++; }
        while ((!isSea(end) || end.lat < LAT0 + 9 / 60 || end.lat > LAT1 - 2 / 60 || end.lon < LON0 + 2 / 60 || end.lon > LON1 - 2 / 60) && tries < 300);
        const dv = nonzero(-4, 4), d = DECL, kk = norm(kr - dv - d);
        const v = rint(8, 14) / 2, min = Math.round(dist / v * 60);
        dist = v * min / 60; end = dest(s0, kr, dist);
        const t0 = rint(8, 15) * 100 + [0, 15, 30, 45][rint(0, 3)];
        const hh = (x) => String(x).padStart(4, '0');
        const t1 = (Math.floor(t0 / 100) * 60 + t0 % 100 + min);
        t.text = `O godz. ${hh(t0)} jacht jest w punkcie <b>S</b>. Płynie kursem kompasowym KK = ${deg3(kk)}, δ = ${ew(dv)} (deklinacja z róży mapy), z prędkością ${num(v, 1)} w, bez dryfu i prądu.<br>
          Oblicz KR i przebytą drogę do godz. ${hh(Math.floor(t1 / 60) * 100 + t1 % 60)}, wykreśl ją linijką od S i odczytaj pozycję zliczoną (PZ).`;
        t.form = `<label for="zkr">KR [°]</label><input id="zkr" inputmode="numeric"><label for="zd">Droga [Mm]</label><input id="zd" inputmode="decimal">`
          + degMinInputs('zla', 'PZ – szerokość φ', 'N', '54') + degMinInputs('zlo', 'PZ – długość λ', 'E', '017');
        t.draw = () => { map.mark(s0, { label: 'S' }); map.focus(s0, W / 2); };
        t.check = () => {
          const a = readNum('zkr'), b = readNum('zd'), la = readDM('zla'), lo = readDM('zlo');
          if ([a, b, la, lo].some(isNaN)) { const e = el.querySelector('#mErr'); e.hidden = false; e.textContent = 'Uzupełnij wszystkie pola.'; return; }
          const okK = angOk(a, kr, 0.5), okD = Math.abs(b - dist) <= 0.1, dd = course({ lat: la, lon: lo }, end).dist, okP = dd <= 0.4;
          map.line(s0, end, { color: 'var(--map-good)', label: `KR ${deg3(kr)}` }); map.mark(end, { color: 'var(--map-good)', label: 'PZ' });
          finish(t, okK + okD + okP, 3, line(okK, `KR = KK + d + δ = ${deg3(kk)} ${sgn(d)} ${sgn(dv)} = ${deg3(kr)}`)
            + line(okD, `Droga = ${num(v, 1)} w × ${min} min = ${num(dist, 2)} Mm`) + line(okP, `PZ: ${fmtLat(end.lat)} ${fmtLon(end.lon)} – Twoja różni się o ${num(dd, 2)} Mm`));
        };
      } else {
        const targets = [{ n: 'główka portu Wilga', p: P(38.4, 9.3) }, { n: 'pława bezpiecznej wody Mo(A)', p: BUOYS[2].p }, { n: 'pława specjalna Fl Y', p: BUOYS[3].p }, { n: 'pława odosobnionego niebezpieczeństwa (wrak)', p: P(14, 21.2) }];
        let a, b, c; let tries = 0;
        do { a = seaPoint([3, 47], [12, 28]); b = targets[rint(0, 3)]; c = course(a, b.p); tries++; } while ((c.dist < 3 || c.dist > 16 || [0.25, 0.5, 0.75].some((f) => !isSea(dest(a, c.brg, c.dist * f)))) && tries < 300);
        const dv = nonzero(-4, 4), d = DECL, v = rint(8, 14) / 2;
        t.text = `Jacht jest w punkcie <b>A</b>. Wyznacz drogę do: <b>${b.n}</b> (punkt B). Zmierz linijką kurs rzeczywisty i odległość, a potem oblicz kurs kompasowy (δ = ${ew(dv)}, deklinacja z róży) i czas przejścia przy prędkości ${num(v, 1)} w.`;
        t.form = `<label for="kkr">KR [°]</label><input id="kkr" inputmode="numeric"><label for="kd">Odległość [Mm]</label><input id="kd" inputmode="decimal">
          <label for="kkk">KK [°]</label><input id="kkk" inputmode="numeric"><label for="kt">Czas przejścia [min]</label><input id="kt" inputmode="numeric">`;
        t.draw = () => { map.mark(a, { label: 'A' }); map.mark(b.p, { label: 'B', color: 'var(--map-ruler)' }); };
        t.check = () => {
          const vals = ['kkr', 'kd', 'kkk', 'kt'].map(readNum);
          if (vals.some(isNaN)) { const e = el.querySelector('#mErr'); e.hidden = false; e.textContent = 'Uzupełnij wszystkie pola.'; return; }
          const kk = norm(c.brg - d - dv), tm = c.dist / v * 60;
          const ok1 = angOk(vals[0], c.brg, 1), ok2 = Math.abs(vals[1] - c.dist) <= 0.15, ok3 = angOk(vals[2], kk, 1), ok4 = Math.abs(vals[3] - tm) <= Math.max(2, tm * 0.04);
          map.line(a, b.p, { color: 'var(--map-good)', label: `${deg3(c.brg)} · ${num(c.dist, 1)} Mm` });
          finish(t, ok1 + ok2 + ok3 + ok4, 4, line(ok1, `KR = ${deg3(c.brg)}`) + line(ok2, `Odległość = ${num(c.dist, 1)} Mm`)
            + line(ok3, `KK = KR − d − δ = ${deg3(c.brg)} ${sgn(-d)} ${sgn(-dv)} = ${deg3(kk)}`) + line(ok4, `Czas = ${num(c.dist, 1)} / ${num(v, 1)} × 60 ≈ ${Math.round(tm)} min`));
        };
      }
      task = t; frame(t);
    }
    menu();
    return { results: () => results };
  }

  window.MapTrainer = { mount, _test: { course, dest, toLat, toLon, X, Y, isSea, W, H, LIGHTS } };
})();
