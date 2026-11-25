/* Sternik Morski – generator grafik SVG do fiszek.
 * Wszystkie grafiki są rysowane z opisu (specyfikacji) zapisanego w treści fiszek,
 * dzięki czemu nowe fiszki nie wymagają rysowania obrazków ręcznie.
 *
 * Rodzaje (visual.kind):
 *   lights     – światła statku nocą (widok: bow | starboard | port | stern)
 *   dayshapes  – znaki dzienne
 *   buoy       – znaki nawigacyjne IALA (region A)
 *   flag       – flagi Międzynarodowego Kodeksu Sygnałowego
 *   flags      – kilka flag obok siebie (np. NC)
 *   rhythm     – charakterystyka światła (animowana)
 *   situation  – sytuacja z góry (kto ustępuje)
 */
(function () {
  'use strict';

  const COL = {
    red: '#d62b2b', green: '#1f9d55', white: '#ffffff', yellow: '#f5c400',
    blue: '#1f3f99', black: '#151515',
    lr: '#ff3b3b', lg: '#2dff7a', lw: '#fffbe8', ly: '#ffd21f', lb: '#4aa3ff'
  };
  const LIGHT = { r: COL.lr, g: COL.lg, w: COL.lw, y: COL.ly, b: COL.lb };
  let uidCounter = 0;
  const uid = (p) => `${p}${++uidCounter}`;

  /* ---------- wspólne ---------- */
  function svg(viewBox, inner, cls) {
    return `<svg class="vis ${cls || ''}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
  }
  function glowDefs(id) {
    return `<filter id="${id}" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }
  function lamp(x, y, c, glowId, extra) {
    return `<circle cx="${x}" cy="${y}" r="3.6" fill="${LIGHT[c] || c}" filter="url(#${glowId})" ${extra || ''}/>`;
  }

  /* ---------- ŚWIATŁA STATKÓW ---------- */
  // Pozycje w układzie 200×140, widok z prawej burty (dziób w prawo).
  const SIDE = {
    mast: [132, 56], mast2: [72, 40], side: [152, 92], stern: [34, 96],
    anchorF: [166, 70], anchorA: [34, 84], ar: [100, [22, 34, 46]], tow: [34, 84],
    tricolor: [100, 14], rog: [100, [26, 37]]
  };
  const BOW = {
    mast: [100, 58], mast2: [102, 42], sideG: [80, 93], sideR: [120, 93],
    anchorF: [100, 64], anchorA: [100, 84], ar: [88, [22, 34, 46]],
    tricolor: [100, 14], rog: [100, [26, 37]]
  };
  const STERN = {
    stern: [100, 97], anchorF: [100, 64], anchorA: [100, 84], ar: [88, [22, 34, 46]],
    tow: [100, 85], tricolor: [100, 14], rog: [100, [26, 37]]
  };

  function hullSide(type, flip) {
    const t = flip ? 'transform="translate(200,0) scale(-1,1)"' : '';
    let s = `<g ${t} fill="none" stroke="#9fb3c8" stroke-width="1.4" opacity=".55">`;
    s += `<path d="M26 99 L184 95 L160 113 L34 113 Z"/>`;
    if (type === 'sail') {
      s += `<line x1="100" y1="12" x2="100" y2="100"/><path d="M100 18 L100 96 L58 96 Z"/><path d="M103 22 L103 96 L168 98 Z"/>`;
    } else if (type === 'small') {
      s += `<path d="M110 100 L110 88 L135 88 L140 100"/>`;
      s += `<line x1="125" y1="88" x2="125" y2="60"/>`;
    } else {
      s += `<path d="M44 100 L44 78 L92 78 L92 100"/><rect x="54" y="66" width="28" height="12"/>`;
      s += `<line x1="72" y1="66" x2="72" y2="38"/><line x1="132" y1="100" x2="132" y2="54"/>`;
    }
    return s + '</g>';
  }
  function hullBow(type) {
    let s = `<g fill="none" stroke="#9fb3c8" stroke-width="1.4" opacity=".55">`;
    s += `<path d="M72 100 L128 100 L104 116 L96 116 Z"/>`;
    if (type === 'sail') s += `<line x1="100" y1="12" x2="100" y2="100"/><path d="M100 18 L84 96 L116 96 Z"/>`;
    else s += `<rect x="82" y="72" width="36" height="28"/><line x1="100" y1="72" x2="100" y2="36"/>`;
    return s + '</g>';
  }
  function hullStern(type) {
    let s = `<g fill="none" stroke="#9fb3c8" stroke-width="1.4" opacity=".55">`;
    s += `<path d="M68 100 L132 100 L124 116 L76 116 Z"/>`;
    if (type === 'sail') s += `<line x1="100" y1="12" x2="100" y2="100"/><path d="M100 18 L82 98 L118 98 Z"/>`;
    else s += `<rect x="80" y="70" width="40" height="30"/><line x1="100" y1="70" x2="100" y2="34"/>`;
    return s + '</g>';
  }

  /** spec: { kind:'lights', view, vessel:'power'|'sail'|'small', carries:[...], ar:['r','w','r'], silhouette:bool }
   *  carries: mast, mast2, side, stern, anchorF, anchorA, tricolor, rog (czerwone nad zielonym), tow (żółte holownicze)
   *  ar: światła widoczne dookoła, od góry (na maszcie) */
  function lights(spec) {
    const g = uid('glow');
    const view = spec.view || 'bow';
    const carries = new Set(spec.carries || []);
    const out = [];
    let hull = '';
    if (view === 'starboard' || view === 'port') {
      const flip = view === 'port';
      const X = (x) => (flip ? 200 - x : x);
      if (spec.silhouette) {
        hull = hullSide(spec.vessel, flip);
        if (spec.ar && spec.vessel !== 'sail') hull += `<line x1="${X(100)}" y1="100" x2="${X(100)}" y2="18" stroke="#9fb3c8" stroke-width="1.4" opacity=".55"/>`;
      }
      if (carries.has('mast')) out.push(lamp(X(SIDE.mast[0]), SIDE.mast[1], 'w', g));
      for (let i = 1; i < (spec.mastV || 0); i++) out.push(lamp(X(SIDE.mast[0]), SIDE.mast[1] - 12 * i, 'w', g));
      if (carries.has('mast2')) out.push(lamp(X(SIDE.mast2[0]), SIDE.mast2[1], 'w', g));
      if (carries.has('side')) {
        const p = spec.vessel === 'sail' ? [150, 95] : SIDE.side;
        out.push(lamp(X(p[0]), p[1], flip ? 'r' : 'g', g));
      }
      if (carries.has('anchorF')) out.push(lamp(X(SIDE.anchorF[0]), SIDE.anchorF[1], 'w', g));
      if (carries.has('anchorA')) out.push(lamp(X(SIDE.anchorA[0]), SIDE.anchorA[1], 'w', g));
      if (carries.has('tricolor')) out.push(lamp(X(SIDE.tricolor[0]), SIDE.tricolor[1], flip ? 'r' : 'g', g));
      if (carries.has('rog')) { out.push(lamp(X(100), SIDE.rog[1][0], 'r', g)); out.push(lamp(X(100), SIDE.rog[1][1], 'g', g)); }
      (spec.ar || []).forEach((c, i) => out.push(lamp(X(SIDE.ar[0]), SIDE.ar[1][i], c, g)));
    } else if (view === 'bow') {
      if (spec.silhouette) hull = hullBow(spec.vessel);
      if (carries.has('mast')) out.push(lamp(...BOW.mast, 'w', g));
      for (let i = 1; i < (spec.mastV || 0); i++) out.push(lamp(BOW.mast[0], BOW.mast[1] - 12 * i, 'w', g));
      if (carries.has('mast2')) out.push(lamp(...BOW.mast2, 'w', g));
      if (carries.has('side')) { out.push(lamp(...BOW.sideG, 'g', g)); out.push(lamp(...BOW.sideR, 'r', g)); }
      if (carries.has('anchorF')) out.push(lamp(...BOW.anchorF, 'w', g));
      if (carries.has('anchorA')) out.push(lamp(...BOW.anchorA, 'w', g));
      if (carries.has('tricolor')) { out.push(lamp(98, 14, 'g', g)); out.push(lamp(102, 14, 'r', g)); }
      if (carries.has('rog')) { out.push(lamp(100, BOW.rog[1][0], 'r', g)); out.push(lamp(100, BOW.rog[1][1], 'g', g)); }
      (spec.ar || []).forEach((c, i) => out.push(lamp(BOW.ar[0], BOW.ar[1][i], c, g)));
    } else { // stern
      if (spec.silhouette) hull = hullStern(spec.vessel);
      if (carries.has('stern')) out.push(lamp(...STERN.stern, 'w', g));
      if (carries.has('tow')) out.push(lamp(...STERN.tow, 'y', g));
      if (carries.has('anchorF')) out.push(lamp(...STERN.anchorF, 'w', g));
      if (carries.has('anchorA')) out.push(lamp(...STERN.anchorA, 'w', g));
      if (carries.has('tricolor')) out.push(lamp(100, 14, 'w', g));
      if (carries.has('rog')) { out.push(lamp(100, STERN.rog[1][0], 'r', g)); out.push(lamp(100, STERN.rog[1][1], 'g', g)); }
      (spec.ar || []).forEach((c, i) => out.push(lamp(STERN.ar[0], STERN.ar[1][i], c, g)));
    }
    const viewName = { bow: 'od dziobu', starboard: 'z prawej burty', port: 'z lewej burty', stern: 'od rufy' }[view];
    const label = spec.silhouette ? `<text x="196" y="134" text-anchor="end" font-size="9" fill="#9fb3c8">widok ${viewName}</text>` : '';
    const inner = `<defs>${glowDefs(g)}<linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#050b1a"/><stop offset="1" stop-color="#0c1a36"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#${g}s)"/>
      <rect y="112" width="200" height="28" fill="#06101f"/>
      <line x1="0" y1="112" x2="200" y2="112" stroke="#1d3358" stroke-width="1"/>
      ${hull}${out.join('')}${label}`;
    return svg('0 0 200 140', inner, 'night');
  }

  /* ---------- ZNAKI DZIENNE ---------- */
  function shape(type, x, y) {
    const k = COL.black;
    switch (type) {
      case 'ball': return `<circle cx="${x}" cy="${y}" r="7" fill="${k}"/>`;
      case 'cone-up': return `<path d="M${x} ${y - 8} L${x + 8} ${y + 7} L${x - 8} ${y + 7} Z" fill="${k}"/>`;
      case 'cone-down': return `<path d="M${x} ${y + 8} L${x + 8} ${y - 7} L${x - 8} ${y - 7} Z" fill="${k}"/>`;
      case 'diamond': return `<path d="M${x} ${y - 9} L${x + 7} ${y} L${x} ${y + 9} L${x - 7} ${y} Z" fill="${k}"/>`;
      case 'cylinder': return `<rect x="${x - 6}" y="${y - 9}" width="12" height="18" fill="${k}"/>`;
      case 'basket': return `<path d="M${x - 8} ${y - 7} L${x + 8} ${y - 7} L${x + 5} ${y + 7} L${x - 5} ${y + 7} Z" fill="none" stroke="${k}" stroke-width="2"/><path d="M${x - 6} ${y - 2} H${x + 6} M${x - 5} ${y + 3} H${x + 5}" stroke="${k}"/>`;
      default: return '';
    }
  }
  /** spec: { kind:'dayshapes', shapes:['ball','diamond','ball'], vessel:'power'|'sail' } */
  function dayshapes(spec) {
    const shapes = spec.shapes || [];
    let s = `<rect width="200" height="140" fill="#cfe6f7"/><rect y="112" width="200" height="28" fill="#5b8db8"/>`;
    s += `<g fill="#e8eef3" stroke="#44546a" stroke-width="1.3">`;
    s += `<path d="M24 100 L176 100 L160 113 L36 113 Z"/>`;
    if (spec.vessel === 'sail') {
      s += `<line x1="120" y1="12" x2="120" y2="100"/><path d="M120 16 L120 96 L72 96 Z" fill="#fff"/><path d="M123 22 L123 96 L170 98 Z" fill="#fff"/>`;
    } else {
      s += `<path d="M44 100 L44 80 L96 80 L96 100"/><rect x="54" y="68" width="28" height="12"/>`;
      s += `<line x1="120" y1="100" x2="120" y2="12"/>`;
    }
    s += `</g>`;
    // znaki zawieszone na rei/sztagu masztu (przed masztem)
    const x = spec.vessel === 'sail' ? 96 : 104;
    const top = 26;
    s += `<line x1="${x}" y1="${top - 12}" x2="${x}" y2="${top + shapes.length * 22}" stroke="#44546a" stroke-width=".8"/>`;
    s += `<line x1="${x}" y1="${top - 12}" x2="120" y2="${top - 12}" stroke="#44546a" stroke-width=".8"/>`;
    shapes.forEach((t, i) => { s += shape(t, x, top + i * 22); });
    return svg('0 0 200 140', s, 'day');
  }

  /* ---------- ZNAKI IALA ---------- */
  const BUOY = {
    'port':     { bands: [COL.red], top: ['can'], tc: COL.red, light: 'r' },
    'stbd':     { bands: [COL.green], top: ['cone-up'], tc: COL.green, light: 'g' },
    'pref-stbd':{ bands: [COL.red, COL.green, COL.red], top: ['can'], tc: COL.red, light: 'r' },
    'pref-port':{ bands: [COL.green, COL.red, COL.green], top: ['cone-up'], tc: COL.green, light: 'g' },
    'card-N':   { bands: [COL.black, COL.yellow], top: ['cone-up', 'cone-up'], tc: COL.black, light: 'w' },
    'card-E':   { bands: [COL.black, COL.yellow, COL.black], top: ['cone-up', 'cone-down'], tc: COL.black, light: 'w' },
    'card-S':   { bands: [COL.yellow, COL.black], top: ['cone-down', 'cone-down'], tc: COL.black, light: 'w' },
    'card-W':   { bands: [COL.yellow, COL.black, COL.yellow], top: ['cone-down', 'cone-up'], tc: COL.black, light: 'w' },
    'isolated': { bands: [COL.black, COL.red, COL.black], top: ['ball', 'ball'], tc: COL.black, light: 'w' },
    'safe':     { vstripes: [COL.red, COL.white], top: ['ball'], tc: COL.red, light: 'w' },
    'special':  { bands: [COL.yellow], top: ['x'], tc: COL.yellow, light: 'y' },
    'wreck':    { vstripes: [COL.blue, COL.yellow], top: ['cross'], tc: COL.yellow, light: 'b' }
  };
  function topmark(t, x, y, c) {
    switch (t) {
      case 'can': return `<rect x="${x - 6}" y="${y - 7}" width="12" height="14" fill="${c}" stroke="#222" stroke-width=".6"/>`;
      case 'cone-up': return `<path d="M${x} ${y - 7} L${x + 7} ${y + 6} L${x - 7} ${y + 6} Z" fill="${c}" stroke="#222" stroke-width=".6"/>`;
      case 'cone-down': return `<path d="M${x} ${y + 7} L${x + 7} ${y - 6} L${x - 7} ${y - 6} Z" fill="${c}" stroke="#222" stroke-width=".6"/>`;
      case 'ball': return `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="#222" stroke-width=".6"/>`;
      case 'x': return `<path d="M${x - 6} ${y - 6} L${x + 6} ${y + 6} M${x + 6} ${y - 6} L${x - 6} ${y + 6}" stroke="${c}" stroke-width="3.2"/><path d="M${x - 6} ${y - 6} L${x + 6} ${y + 6} M${x + 6} ${y - 6} L${x - 6} ${y + 6}" stroke="#222" stroke-width=".5" fill="none"/>`;
      case 'cross': return `<path d="M${x} ${y - 7} V${y + 7} M${x - 7} ${y} H${x + 7}" stroke="${c}" stroke-width="3.4"/>`;
      default: return '';
    }
  }
  /** spec: { kind:'buoy', type:'card-N', light:'VQ' (opcjonalnie – animacja), night:false } */
  function buoy(spec) {
    const d = BUOY[spec.type];
    if (!d) return '';
    const clip = uid('bc');
    const g = uid('glow');
    const body = 'M86 66 L114 66 L126 118 L74 118 Z';
    let s = `<defs>${glowDefs(g)}<clipPath id="${clip}"><path d="${body}"/></clipPath></defs>`;
    s += spec.night
      ? `<rect width="200" height="160" fill="#07122a"/><rect y="116" width="200" height="44" fill="#040b1a"/>`
      : `<rect width="200" height="160" fill="#d8ecf8"/><rect y="116" width="200" height="44" fill="#4f86b4"/>`;
    s += `<g opacity="${spec.night ? 0.25 : 1}">`;
    s += `<g clip-path="url(#${clip})">`;
    if (d.bands) {
      const h = 52 / d.bands.length;
      d.bands.forEach((c, i) => { s += `<rect x="70" y="${66 + i * h}" width="60" height="${h + 0.5}" fill="${c}"/>`; });
    } else {
      const n = 6, w = 56 / n;
      for (let i = 0; i < n; i++) s += `<rect x="${72 + i * w}" y="60" width="${w + 0.5}" height="60" fill="${d.vstripes[i % 2]}"/>`;
    }
    s += `</g><path d="${body}" fill="none" stroke="#222" stroke-width="1"/>`;
    s += `<rect x="72" y="116" width="56" height="6" rx="2" fill="#333"/>`;
    // maszt i znak szczytowy
    s += `<line x1="100" y1="66" x2="100" y2="22" stroke="#333" stroke-width="2"/>`;
    const tops = d.top;
    tops.forEach((t, i) => { s += topmark(t, 100, tops.length === 2 ? 22 + i * 17 : 30, d.tc); });
    s += `</g>`;
    if (spec.light) {
      const lit = `<circle cx="100" cy="58" r="4.5" fill="${LIGHT[d.light]}" filter="url(#${g})" data-rhythm="${spec.light}"/>`;
      s += lit;
    }
    // fale
    s += `<path d="M0 128 Q10 124 20 128 T40 128 T60 128 T80 128 T100 128 T120 128 T140 128 T160 128 T180 128 T200 128" stroke="${spec.night ? '#16325c' : '#9cc3e4'}" fill="none"/>`;
    return svg('0 0 200 160', s, spec.night ? 'night' : 'day');
  }

  /* ---------- FLAGI MKS ---------- */
  const R = COL.red, B = COL.blue, Y = COL.yellow, W = COL.white, K = COL.black;
  const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const hstripes = (cols) => cols.map((c, i) => rect(0, i * 100 / cols.length, 150, 100 / cols.length + 0.3, c)).join('');
  const vstripes = (cols) => cols.map((c, i) => rect(i * 150 / cols.length, 0, 150 / cols.length + 0.3, 100, c)).join('');
  const quarters = (a, b) => rect(0, 0, 75, 50, a) + rect(75, 0, 75, 50, b) + rect(0, 50, 75, 50, b) + rect(75, 50, 75, 50, a);
  const saltire = (bg, c) => rect(0, 0, 150, 100, bg) + `<path d="M0 0 L150 100 M150 0 L0 100" stroke="${c}" stroke-width="20"/>`;
  const SWALLOW = '0,0 150,0 112,50 150,100 0,100';
  const FLAGS = {
    A: () => rect(0, 0, 75, 100, W) + `<polygon points="75,0 150,0 112,50 150,100 75,100" fill="${B}"/>`,
    B: () => `<polygon points="${SWALLOW}" fill="${R}"/>`,
    C: () => hstripes([B, W, R, W, B]),
    D: () => rect(0, 0, 150, 25, Y) + rect(0, 25, 150, 50, B) + rect(0, 75, 150, 25, Y),
    E: () => hstripes([B, R]),
    F: () => rect(0, 0, 150, 100, W) + `<polygon points="75,0 150,50 75,100 0,50" fill="${R}"/>`,
    G: () => vstripes([Y, B, Y, B, Y, B]),
    H: () => vstripes([W, R]),
    I: () => rect(0, 0, 150, 100, Y) + `<circle cx="75" cy="50" r="27" fill="${K}"/>`,
    J: () => hstripes([B, W, B]),
    K: () => vstripes([Y, B]),
    L: () => quarters(Y, K),
    M: () => saltire(B, W),
    N: () => { let s = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s += rect(c * 37.5, r * 25, 37.8, 25.3, (r + c) % 2 ? W : B); return s; },
    O: () => `<polygon points="0,0 150,0 150,100" fill="${R}"/><polygon points="0,0 0,100 150,100" fill="${Y}"/>`,
    P: () => rect(0, 0, 150, 100, B) + rect(50, 33, 50, 34, W),
    Q: () => rect(0, 0, 150, 100, Y),
    R: () => rect(0, 0, 150, 100, R) + rect(0, 40, 150, 20, Y) + rect(65, 0, 20, 100, Y),
    S: () => rect(0, 0, 150, 100, W) + rect(50, 33, 50, 34, B),
    T: () => vstripes([R, W, B]),
    U: () => quarters(R, W),
    V: () => saltire(W, R),
    W: () => rect(0, 0, 150, 100, B) + rect(22, 16, 106, 68, W) + rect(50, 34, 50, 32, R),
    X: () => rect(0, 0, 150, 100, W) + rect(0, 39, 150, 22, B) + rect(64, 0, 22, 100, B),
    Y: (id) => `<defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width="12" height="24" fill="${Y}"/><rect x="12" width="12" height="24" fill="${R}"/></pattern></defs>
        <rect width="150" height="100" fill="url(#${id})"/>`,
    Z: () => `<polygon points="0,0 150,0 75,50" fill="${Y}"/><polygon points="150,0 150,100 75,50" fill="${B}"/>
        <polygon points="0,100 150,100 75,50" fill="${R}"/><polygon points="0,0 0,100 75,50" fill="${K}"/>`
  };
  function flagInner(letter) {
    const f = FLAGS[letter];
    if (!f) return '';
    const outline = (letter === 'A' || letter === 'B')
      ? `<polygon points="${SWALLOW}" fill="none" stroke="#8a96a3" stroke-width="1.5"/>`
      : `<rect width="150" height="100" fill="none" stroke="#8a96a3" stroke-width="1.5"/>`;
    return f(uid('fp')) + outline;
  }
  /** spec: { kind:'flag', letter:'A' } */
  function flag(spec) {
    return svg('-4 -4 158 108', flagInner(spec.letter), 'flag');
  }
  /** spec: { kind:'flags', letters:['N','C'], vertical:true } – flagi na fale (jedna pod drugą) */
  function flags(spec) {
    const L = spec.letters || [];
    const vertical = spec.vertical !== false;
    let s = '';
    L.forEach((l, i) => {
      const tx = vertical ? 0 : i * 165, ty = vertical ? i * 112 : 0;
      s += `<g transform="translate(${tx},${ty})">${flagInner(l)}</g>`;
    });
    const w = vertical ? 158 : L.length * 165;
    const h = vertical ? L.length * 112 : 108;
    return svg(`-4 -4 ${w} ${h}`, s, 'flag');
  }

  /* ---------- CHARAKTERYSTYKI ŚWIATEŁ ---------- */
  // Zamienia zapis (np. "VQ(6)+LFl 10s", "Fl(2+1) R 10s", "Iso 4s", "Mo(A) 6s") na listę odcinków [start,koniec] w okresie.
  function parseRhythm(str) {
    const s = String(str).replace(/\s+[RGWYB]{1}(?=\s|$)/g, ' ').trim();
    const periodM = s.match(/(\d+(?:[.,]\d+)?)s\b/);
    let period = periodM ? parseFloat(periodM[1].replace(',', '.')) : null;
    const body = s.replace(/(\d+(?:[.,]\d+)?)s\b/, '').trim();
    const on = [];
    let t = 0;
    const flash = (d) => { on.push([t, t + d]); t += d; };
    const dark = (d) => { t += d; };

    const parts = body.split('+').map((p) => p.trim());
    // Fl(2+1) – grupa złożona zapisana w nawiasie
    const comp = body.match(/^(Fl|Q|VQ|Oc)\((\d+)\+(\d+)\)/);
    if (comp) {
      const [, type, a, b] = comp;
      const fd = { Fl: 0.5, Q: 0.3, VQ: 0.2 }[type] || 0.5;
      const gap = { Fl: 1, Q: 0.7, VQ: 0.3 }[type] || 1;
      for (let i = 0; i < +a; i++) { flash(fd); dark(gap); }
      dark(1.5);
      for (let i = 0; i < +b; i++) { flash(fd); if (i < +b - 1) dark(gap); }
      return { on, period: period || t + 3 };
    }
    for (const p of parts) {
      let m;
      if ((m = p.match(/^(VQ|Q)(?:\((\d+)\))?$/))) {
        const vq = m[1] === 'VQ';
        const n = m[2] ? +m[2] : null;
        const fd = vq ? 0.2 : 0.3, gap = vq ? 0.3 : 0.7;
        if (n === null && parts.length === 1) { flash(fd); dark(gap); return { on, period: period || t }; }
        for (let i = 0; i < (n || 1); i++) { flash(fd); dark(gap); }
      } else if ((m = p.match(/^LFl(?:\((\d+)\))?$/))) {
        const n = m[1] ? +m[1] : 1;
        for (let i = 0; i < n; i++) { flash(2); dark(1); }
      } else if ((m = p.match(/^Fl(?:\((\d+)\))?$/))) {
        const n = m[1] ? +m[1] : 1;
        for (let i = 0; i < n; i++) { flash(0.5); dark(1); }
      } else if ((m = p.match(/^Oc(?:\((\d+)\))?$/))) {
        const n = m[1] ? +m[1] : 1;
        const P = period || 4;
        if (n === 1) return { on: [[0, P - 1]], period: P };
        // Oc(n): n zaciemnień w okresie
        const res = []; let x = 0;
        for (let i = 0; i < n; i++) { res.push([x, x + (i === n - 1 ? 0 : 1.2)]); x += 1.2 + 0.6; }
        res[res.length - 1][1] = P - 0.6;
        return { on: res.filter(([a, b]) => b > a), period: P };
      } else if ((m = p.match(/^Iso$/))) {
        const P = period || 4;
        return { on: [[0, P / 2]], period: P };
      } else if ((m = p.match(/^F$/))) {
        return { on: [[0, 1]], period: 1 };
      } else if ((m = p.match(/^Mo\(([A-Z])\)$/))) {
        const MORSE = { A: '.-', U: '..-', D: '-..', N: '-.', K: '-.-', O: '---', R: '.-.' };
        const code = MORSE[m[1]] || '.-';
        [...code].forEach((c, i) => { flash(c === '.' ? 0.5 : 1.5); if (i < code.length - 1) dark(0.5); });
        dark(1);
      } else if ((m = p.match(/^Al/))) {
        return { on: [[0, 1.5]], period: period || 3, alt: true };
      }
    }
    return { on, period: period || t + 1 };
  }
  /** spec: { kind:'rhythm', code:'VQ(3) 5s', color:'w' } – pojedyncze światło z animacją */
  function rhythm(spec) {
    const g = uid('glow');
    const c = LIGHT[spec.color || 'w'];
    const s = `<defs>${glowDefs(g)}</defs><rect width="200" height="120" fill="#050b1a"/>
      <circle cx="100" cy="52" r="9" fill="${c}" filter="url(#${g})" data-rhythm="${spec.code}"/>
      ${spec.showCode ? `<text x="100" y="108" text-anchor="middle" font-size="13" fill="#9fb3c8">${spec.code}</text>` : ''}`;
    return svg('0 0 200 120', s, 'night');
  }

  /* ---------- SYTUACJE (WIDOK Z GÓRY) ---------- */
  /** spec: { kind:'situation', wind: 0 (skąd wieje, stopnie) | null,
   *          boats:[{x,y,h,type:'sail'|'power'|'fishing',label:'A',me:true}] } */
  function situation(spec) {
    let s = `<rect width="200" height="200" fill="#2f6f9f"/>`;
    const id = uid('arr');
    s += `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#e9f2fa"/></marker></defs>`;
    if (spec.wind !== undefined && spec.wind !== null) {
      // strzałka wiatru: wiatr wieje Z kierunku spec.wind
      const rad = (spec.wind - 90) * Math.PI / 180;
      const cx = 172, cy = 28;
      const x1 = cx + Math.cos(rad) * 16, y1 = cy + Math.sin(rad) * 16;
      const x2 = cx - Math.cos(rad) * 16, y2 = cy - Math.sin(rad) * 16;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e9f2fa" stroke-width="2.2" marker-end="url(#${id})"/>`;
      s += `<text x="${cx}" y="${cy + 30}" font-size="10" text-anchor="middle" fill="#e9f2fa">wiatr</text>`;
    }
    (spec.boats || []).forEach((b) => {
      const col = b.me ? '#ffd166' : '#ffffff';
      let g = `<g transform="translate(${b.x},${b.y}) rotate(${b.h}) scale(1.25)">`;
      g += `<line x1="0" y1="-14" x2="0" y2="-40" stroke="${col}" stroke-dasharray="3 3" stroke-width="1.2" opacity=".8"/>`;
      if (b.type === 'power' || b.type === 'fishing') {
        g += `<path d="M0 -14 L6 -4 L6 12 L-6 12 L-6 -4 Z" fill="${col}" stroke="#1b2b3c" stroke-width="1"/>`;
        if (b.type === 'fishing') g += `<path d="M0 12 L0 30" stroke="${col}" stroke-dasharray="2 2"/>`;
      } else {
        g += `<path d="M0 -14 C6 -6 6 6 4 12 L-4 12 C-6 6 -6 -6 0 -14 Z" fill="${col}" stroke="#1b2b3c" stroke-width="1"/>`;
        if (spec.wind !== undefined && spec.wind !== null) {
          let rel = ((spec.wind - b.h) % 360 + 540) % 360 - 180; // >0: wiatr z prawej burty
          const side = rel > 0 ? -1 : 1; // bom po stronie zawietrznej
          g += `<line x1="0" y1="-4" x2="${side * 11}" y2="10" stroke="#1b2b3c" stroke-width="2.2"/>`;
        }
      }
      g += `</g>`;
      if (b.label) g += `<text x="${b.x + 14}" y="${b.y + 4}" font-size="13" font-weight="700" fill="${col}">${b.label}</text>`;
      s += g;
    });
    return svg('0 0 200 200', s, 'sit');
  }


  /* ---------- SYGNAŁY DŹWIĘKOWE ---------- */
  // seq: tokeny oddzielone spacją: S (krótki ~1 s), L (długi 4–6 s), B (dzwon – szybkie dzwonienie ~5 s),
  //      G (gong), K (pojedyncze wyraźne uderzenie w dzwon), | (przerwa)
  function sound(spec) {
    const toks = String(spec.seq).trim().split(/\s+/);
    const unit = { S: 14, L: 52, B: 46, G: 40, K: 8, '|': 14 };
    let x = 10; let s = '';
    const W = Math.max(200, toks.reduce((a, t) => a + (unit[t] || 14) + 8, 20));
    toks.forEach((t) => {
      const w = unit[t] || 14;
      if (t === 'S' || t === 'L') s += `<rect x="${x}" y="26" width="${w}" height="18" rx="4" fill="#ffd21f"/>`;
      else if (t === 'K') s += `<circle cx="${x + 4}" cy="35" r="5" fill="#9fd3ff"/>`;
      else if (t === 'B') {
        s += `<path d="M${x + 8} 44 Q${x + 8} 24 ${x + 18} 22 Q${x + 28} 24 ${x + 28} 44 Z" fill="#9fd3ff"/>`;
        s += `<path d="M${x + 32} 28 q4 7 0 14 M${x + 38} 25 q6 10 0 20" stroke="#9fd3ff" fill="none" stroke-width="2"/>`;
      } else if (t === 'G') {
        s += `<circle cx="${x + 16}" cy="35" r="12" fill="none" stroke="#ffb27a" stroke-width="4"/><circle cx="${x + 16}" cy="35" r="3" fill="#ffb27a"/>`;
      }
      x += w + 8;
    });
    const legend = `<text x="10" y="66" font-size="10" fill="#9fb3c8">krótki ≈ 1 s · długi 4–6 s</text>`;
    const svgs = svg(`0 0 ${W} 74`, `<rect width="${W}" height="74" rx="8" fill="#0a1730"/>${s}${legend}`, 'snd');
    return `<div class="sound-wrap">${svgs}<button type="button" class="btn play" data-sound="${toks.join(' ')}">▶ Odtwórz sygnał</button></div>`;
  }
  let audioCtx = null;
  function playSeq(seq, btn) {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const ctx = audioCtx; let t = ctx.currentTime + 0.1;
    const horn = (dur) => {
      const o = ctx.createOscillator(); const o2 = ctx.createOscillator(); const gn = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 150; o2.type = 'square'; o2.frequency.value = 151.5;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.12, t + 0.06);
      gn.gain.setValueAtTime(0.12, t + dur - 0.08); gn.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(gn); o2.connect(gn); gn.connect(ctx.destination); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
      t += dur + 1;
    };
    const ping = (freq, len, vol) => {
      const o = ctx.createOscillator(); const gn = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(gn); gn.connect(ctx.destination); o.start(t); o.stop(t + len);
    };
    String(seq).split(' ').forEach((k) => {
      if (k === 'S') horn(1);
      else if (k === 'L') horn(4.5);
      else if (k === 'B') { for (let i = 0; i < 25; i++) { ping(1250, 0.35, 0.18); t += 0.2; } t += 0.8; }
      else if (k === 'G') { for (let i = 0; i < 6; i++) { ping(220, 1.2, 0.3); t += 0.8; } t += 0.6; }
      else if (k === 'K') { ping(1250, 0.9, 0.25); t += 0.9; }
      else t += 1;
    });
    if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, (t - ctx.currentTime) * 1000); }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-sound]');
      if (b) { e.stopPropagation(); playSeq(b.getAttribute('data-sound'), b); }
    });
  }

  /* ---------- API ---------- */
  function render(spec) {
    if (!spec) return '';
    switch (spec.kind) {
      case 'lights': return lights(spec);
      case 'dayshapes': return dayshapes(spec);
      case 'buoy': return buoy(spec);
      case 'flag': return flag(spec);
      case 'flags': return flags(spec);
      case 'rhythm': return rhythm(spec);
      case 'situation': return situation(spec);
      case 'sound': return sound(spec);
      default: return '';
    }
  }

  // Animacja świateł: jeden zegar dla wszystkich elementów z atrybutem data-rhythm.
  const cache = new Map();
  function tick(now) {
    const t = now / 1000;
    document.querySelectorAll('[data-rhythm]').forEach((el) => {
      const code = el.getAttribute('data-rhythm');
      let r = cache.get(code);
      if (!r) { r = parseRhythm(code); cache.set(code, r); }
      const x = t % r.period;
      const lit = r.on.some(([a, b]) => x >= a && x < b);
      el.style.opacity = lit ? 1 : 0.06;
    });
    requestAnimationFrame(tick);
  }
  if (typeof window !== 'undefined') {
    window.Visuals = { render, parseRhythm };
    requestAnimationFrame(tick);
  }
})();
