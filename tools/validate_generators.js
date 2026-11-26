// Sprawdza wszystkie generatory zadań: 300 losowań każdego, bez NaN/undefined, z 3 różnymi błędnymi odpowiedziami.
global.window = {};
require('../js/generators.js');
const G = window.Generators;
let bad = 0;
for (const k of G.kinds) {
  for (let i = 0; i < 300; i++) {
    const t = G.make(k);
    const m = t.mc;
    const txt = JSON.stringify(t);
    if (!t.q || !t.a || /NaN|undefined|Infinity/.test(txt) || !m || m.wrong.length !== 3 || new Set(m.wrong).size !== 3 || m.wrong.includes(m.correct)) {
      bad++; if (bad < 5) console.log('BŁĄD', k, txt.slice(0, 300));
    }
  }
}
console.log(`Generatory: ${G.kinds.length}, błędów: ${bad}`);
process.exit(bad ? 1 : 0);
