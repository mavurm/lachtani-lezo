# Levely (cesty) – plán stavby

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat do hry Lachtaní lézo ručně postavené cesty (2 sektory, 8 cest) s průvodcem, hvězdičkami, odemykáním, převisem a dynem, a nechat nekonečnou stěnu beze změny.

**Architecture:** Všechno zůstává v jednom souboru `adelka.html` (jedna IIFE, globální stav `G`). Cesty jsou data zapsaná krátkými řetězci (`parseHolds`), hra má „režim cesty“ (`G.route` není `null`), ve kterém se chyty, jištění, vylepšení a události berou ze zápisu cesty místo náhodného generování. Testy běží v prohlížeči: `tools/make_test.py` slepí hru s malým testovacím rámcem do `tests/test.html`.

**Tech Stack:** čisté HTML/CSS/JS v jednom souboru, canvas 2D, Python 3 pro pomocné skripty, Claude Browser pane pro spouštění testů.

**Spec:** `specs/2026-10-25-levely-design.md`

## Global Constraints

- Veškerý kód hry zůstává v `adelka.html`; žádné externí knihovny ani další soubory, které by hra načítala.
- Texty pro hráče česky, s diakritikou.
- Nekonečná stěna (tlačítko „Nekonečná stěna“) se musí chovat přesně jako před změnou, včetně rekordu a žebříčku na claude.ai.
- Na cestách se nic nespouští náhodně: odpočinek, Den lezení, vylepšení, jištění a překážky jen podle zápisu cesty.
- 3. pád na cestě = cesta končí, „Zkusit znovu“ od začátku.
- Dyno: jen perfektní trefa (na liště jen zelený střed).
- Hvězdičky: ★ dolezeno; ★★ nejvýš 1 pád; ★★★ bez pádu a aspoň třetina tahů perfektně.
- Překližka se odemkne za 6 ★ z Haly.
- Postup ukládat do `localStorage` pod klíčem `adelka.routes` přes existující `store` (try/catch).
- Ladicí háček `window.__adelka` se nikdy nesmí dostat do `adelka.html` – patří jen do `tests/test.html`.
- Commit zprávy česky a končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Publikace (artifact na claude.ai, `docs/` + push na GitHub) až v posledním úkolu a až po souhlasu uživatele.
- Nahrávky jsou v `zvuky.js` vedle hry (`<script src="zvuky.js"></script>` v `adelka.html`); ten soubor se v tomto plánu nemění.

## Jak spouštět testy (platí pro všechny úkoly)

1. `python tools/make_test.py` (v kořeni projektu `C:/Users/mavur/Desktop/Claude/Lachtan na lézu`).
2. V Claude Browser pane otevřít `file:///C:/Users/mavur/Desktop/Claude/Lachtan%20na%20l%C3%A9zu/tests/test.html` (nástroj `navigate`), pak `resize_window` preset `mobile`.
3. Spustit v `javascript_tool`:
   ```js
   await new Promise(r => { const t = setInterval(() => { if (window.TEST_DONE) { clearInterval(t); r(); } }, 250); });
   JSON.stringify(window.TEST_RESULT, null, 1)
   ```
4. Výsledek je seznam řádků `PASS …` / `FAIL …`. Úspěch = žádný `FAIL`.

Testy volají vnitřní funkce hry přes `A('jménoFunkce')` (přímý `eval` uvnitř hry), takže vidí i neexportované proměnné. Herní čas posouvají synchronně voláním `update()`, takže proběhnou rychle.

---

### Task 1: Testovací rámec

**Files:**
- Create: `tools/make_test.py`
- Create: `tests/harness.js`
- Create: `tests/smoke.test.js`
- Create: `.gitignore`

**Interfaces:**
- Produces: `tests/test.html` (generovaný, v gitu ignorovaný); v testech globální `test(name, fn)`, `eq(actual, expected, msg)`, `ok(value, msg)`, `A(name)`, `step(seconds)`, `sleep(ms)`, `jumpTo(i)`, `climbPerfect(maxMoves)`.

- [ ] **Step 1: Napsat sestavovací skript**

`tools/make_test.py`:
```python
# Builds tests/test.html: the game with an eval hook for the tests, the tiny harness and every tests/*.test.js.
import glob, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
game = io.open(os.path.join(ROOT, 'adelka.html'), encoding='utf-8').read()
marker = '/* ---------- boot ---------- */'
assert game.count(marker) == 1, 'boot marker missing'
game = game.replace(marker, 'window.__adelka = n => eval(n);\n' + marker)
# the test page lives in tests/, the recordings next to the game
game = game.replace('<script src="zvuky.js"></script>', '<script src="../zvuky.js"></script>')
parts = [io.open(os.path.join(ROOT, 'tests', 'harness.js'), encoding='utf-8').read()]
for f in sorted(glob.glob(os.path.join(ROOT, 'tests', '*.test.js'))):
    parts.append(io.open(f, encoding='utf-8').read())
html = ('<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head>'
        '<body style="margin:0">' + game + '<script>\n' + '\n'.join(parts) + '\n</script></body></html>')
io.open(os.path.join(ROOT, 'tests', 'test.html'), 'w', encoding='utf-8', newline='\n').write(html)
print('tests/test.html built with', len(parts) - 1, 'test files')
```

- [ ] **Step 2: Napsat testovací rámec**

`tests/harness.js`:
```js
// Tiny in-browser test harness. Tests run after the game has booted; results land in window.TEST_RESULT.
window.TESTS = [];
function test(name, fn) { TESTS.push({ name, fn }); }
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error((msg ? msg + ': ' : '') + 'expected ' + e + ', got ' + a);
}
function ok(value, msg) { if (!value) throw new Error(msg || 'expected truthy value'); }
const A = name => window.__adelka(name);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// advance game time synchronously
function step(seconds) { const u = A('update'); for (let t = 0; t < seconds; t += 0.05) u(0.05); }
// put Adélka on hold i, ready to climb
function jumpTo(i) { const G = A('G'); G.cur = i; G.mode = 'climb'; G.sx = A('holdX')(i); G.sy = A('holdY')(i); A('newZone')(); }
// climb with perfect taps; clips instantly, skips rests and climbing days; stops at the top or game end
function climbPerfect(maxMoves) {
  const G = A('G');
  for (let k = 0; k < 600 && G.mode !== 'over' && G.mode !== 'top'; k++) {
    if (G.mode === 'climb') { if (maxMoves-- <= 0) return; G.p = G.zc; A('tap')(); step(0.7); }
    else if (G.mode === 'clip') A('clipDone')();
    else if (G.mode === 'rest') { G.rest.t = 4; step(0.1); }
    else if (G.mode === 'day') { G.day.t = A('DAY_LEN'); step(0.1); }
    else step(0.1);
  }
}
async function runTests() {
  const res = [];
  for (const t of TESTS) {
    try { await t.fn(); res.push('PASS ' + t.name); }
    catch (e) { res.push('FAIL ' + t.name + ': ' + e.message); }
  }
  window.TEST_RESULT = res;
  window.TEST_DONE = true;
  const pre = document.createElement('pre');
  pre.style.cssText = 'position:fixed;inset:0;z-index:99;margin:0;padding:12px;background:#fff;color:#000;font:12px monospace;overflow:auto';
  pre.textContent = res.join('\n');
  document.body.appendChild(pre);
}
window.addEventListener('load', () => setTimeout(runTests, 300));
```

- [ ] **Step 3: Napsat kouřový test**

`tests/smoke.test.js`:
```js
test('hra se načte v menu', () => {
  eq(A('G').mode, 'menu');
});
test('nekonečná stěna generuje chyty s typem', () => {
  ok(A('hold')(30).t, 'chyt 30 má typ');
  A('ensureBolts')(20);
  ok(A('isBolt')(A('bolts').find(b => b > 0)), 'existuje jištění');
});
```

- [ ] **Step 4: Ignorovat vygenerovaný soubor**

`.gitignore`:
```
tests/test.html
```

- [ ] **Step 5: Spustit testy**

Podle „Jak spouštět testy“. Expected: `PASS hra se načte v menu`, `PASS nekonečná stěna generuje chyty s typem`.

- [ ] **Step 6: Commit**

```bash
git add tools/make_test.py tests/harness.js tests/smoke.test.js .gitignore
git commit -m "Testovací rámec v prohlížeči" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Data cest, zápis a kontrola

**Files:**
- Modify: `adelka.html` – sekce `/* ---------- route ---------- */`, hned za řádek `const gradeAt = i => GRADES[...]`
- Test: `tests/routes.test.js`

**Interfaces:**
- Produces: `GRADE_LEVEL` (objekt stupeň → číslo), `SECTORS` (pole `{id, name, desc, wall, need}`), `parseHolds(str) → Array<hold>`, `ROUTES` (pole `{id, name, grade, color, sector, holds}`), `sectorOf(route) → sector`, `routesIn(sectorId) → route[]`, `routeMoves(route) → number`, `validateRoute(route) → string[]` (prázdné = v pořádku).
- Hold v zápisu: `{ t, x, bolt?, rest?, day?, eye?, wind?, crux?, roof?, dyno?, item? }` nebo `{ gap: true }`.

- [ ] **Step 1: Napsat padající testy**

`tests/routes.test.js`:
```js
test('parser čte typ, polohu, značky a vylepšení', () => {
  const p = A('parseHolds')('J50 C42b S58xo!p __ K60y');
  eq(p.length, 5);
  eq(p[0], { t: 'jug', x: 0.5 });
  eq(p[1], { t: 'crimp', x: 0.42, bolt: true });
  eq(p[2], { t: 'sloper', x: 0.58, crux: true, roof: true, item: 'beer' });
  eq(p[3], { gap: true });
  eq(p[4], { t: 'pocket', x: 0.6, dyno: true });
});
test('parser odmítne neznámý chyt', () => {
  let err = null;
  try { A('parseHolds')('J50 Q33'); } catch (e) { err = e; }
  ok(err && /Q33/.test(err.message), 'chyba zmiňuje špatný token');
});
test('cesty odpovídají návrhu', () => {
  eq(A('ROUTES').map(r => [r.id, r.grade, r.sector, r.holds.length]), [
    ['rozlez', '4a', 'hala', 15],
    ['mnam-madla', '4c', 'hala', 18],
    ['kedlubna', '5a', 'hala', 20],
    ['smazakova-spara', '5b', 'hala', 24],
    ['previsla-kytara', '5c', 'preklizka', 22],
    ['dobeeeer', '6a', 'preklizka', 26],
    ['den-lezeni', '6a+', 'preklizka', 28],
    ['pumpovaci-stroj', '6b', 'preklizka', 32]
  ]);
});
test('všechny cesty projdou kontrolou', () => {
  for (const r of A('ROUTES')) eq(A('validateRoute')(r), [], r.id);
});
test('kontrola najde dyno bez mezery', () => {
  const r = { id: 'x', grade: '5a', sector: 'hala', color: '#fff', holds: A('parseHolds')('J50 J44 J56b J45 J55y J46 J54 J45 J56 J50') };
  ok(A('validateRoute')(r).some(m => /dyno 4/.test(m)), 'hlásí dyno 4');
});
test('stupně mají ekvivalent obtížnosti', () => {
  eq(A('GRADE_LEVEL'), { '4a': 0, '4c': 6, '5a': 10, '5b': 15, '5c': 20, '6a': 26, '6a+': 30, '6b': 36 });
});
test('počet tahů nepočítá start ani mezeru', () => {
  eq(A('routeMoves')(A('ROUTES')[0]), 14);
  eq(A('routeMoves')(A('ROUTES')[5]), 24);
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Spustit testy. Expected: nové testy `FAIL` (např. `parseHolds is not defined`), kouřové `PASS`.

- [ ] **Step 3: Přidat data a funkce**

V `adelka.html` vložit hned za řádek
`const gradeAt = i => GRADES[Math.min(GRADES.length - 1, Math.floor(i / 4))];`
tento blok:
```js
/* ---------- routes (levels) ----------
   A route is written as space-separated holds: type letter, x position in percent, then flags.
   Types: J jug, C crimp, S sloper, P pinch, K pocket. Flags: b bolt, r rest, d climbing day, e chalk in the eyes,
   w wind gust, x crux, o roof (overhang), y dyno onto this hold. Items after "!": c chalk, f fried cheese, p beer.
   "__" is the gap a dyno jumps over. */
const GRADE_LEVEL = { '4a': 0, '4c': 6, '5a': 10, '5b': 15, '5c': 20, '6a': 26, '6a+': 30, '6b': 36 };
const SECTORS = [
  { id: 'hala', name: 'Hala', desc: 'Začátky na modrých panelech. Madla, první cvaky a smažák.', wall: 0, need: 0 },
  { id: 'preklizka', name: 'Překližka', desc: 'Dřevo, převisy a první dyno. Tady už to pumpuje.', wall: 1, need: 6 }
];
const HOLD_CODE = { J: 'jug', C: 'crimp', S: 'sloper', P: 'pinch', K: 'pocket' };
const ITEM_CODE = { c: 'chalk', f: 'fried', p: 'beer' };
const FLAG_CODE = [['b', 'bolt'], ['r', 'rest'], ['d', 'day'], ['e', 'eye'], ['w', 'wind'], ['x', 'crux'], ['o', 'roof'], ['y', 'dyno']];
function parseHolds(str) {
  return str.trim().split(/\s+/).map(tok => {
    if (tok === '__') return { gap: true };
    const m = /^([JCSPK])(\d\d)([a-z]*)(?:!([cfp]))?$/.exec(tok);
    if (!m) throw new Error('Neznámý chyt: ' + tok);
    const h = { t: HOLD_CODE[m[1]], x: +m[2] / 100 };
    for (const [ch, key] of FLAG_CODE) if (m[3].includes(ch)) h[key] = true;
    if (m[4]) h.item = ITEM_CODE[m[4]];
    return h;
  });
}
const ROUTES = [
  { id: 'rozlez', name: 'Rozlez', grade: '4a', color: '#46c8ff', sector: 'hala',
    holds: parseHolds('J50 J44 J56 J45 J55 J46b J54 J45 J56 J47 J53b J45 J55 J48 J52') },
  { id: 'mnam-madla', name: 'Mňam madla', grade: '4c', color: '#7ae04b', sector: 'hala',
    holds: parseHolds('J50 J44 J56 C45 J55b C44 J56!c C55 J45r J46b J55 C44 J56!f J45 C55b J46 J54 J50') },
  { id: 'kedlubna', name: 'Kedlubna', grade: '5a', color: '#ffd23f', sector: 'hala',
    holds: parseHolds('J50 J44 K56 J45 P55b K44 J56!c P45 J55b K46 J54r P45 K56 J45b P55 K44 J56 P45b J55 J50') },
  { id: 'smazakova-spara', name: 'Smažákova spára', grade: '5b', color: '#ff7a2f', sector: 'hala',
    holds: parseHolds('J50 J44 C56 J45 K55b J44 C56 P45 J55b K44 J56r!c C45 J55b J46!p C55 S44x S56xb S45x J55 J46r J55b K45 J55 J50') },
  { id: 'previsla-kytara', name: 'Převislá kytara', grade: '5c', color: '#ff4fa3', sector: 'preklizka',
    holds: parseHolds('J50 J44 C56 J45 P55b J44 K56 J45r C55b J46o J54o C45o J55ob J46o C55 J45r K55b P45 J55 C46 J54b J50') },
  { id: 'dobeeeer', name: 'Dobeeeer', grade: '6a', color: '#9b7bd6', sector: 'preklizka',
    holds: parseHolds('J50 J44 C56 K45 J55b P44 C56 J45 J55rb C44!c J56 __ J44y C55b P45 K56 J45 J55rb S44 C56 J45 P55b K44 J56 C45 J50b') },
  { id: 'den-lezeni', name: 'Já říkal den lezení', grade: '6a+', color: '#f2a33a', sector: 'preklizka',
    holds: parseHolds('J50 J44 C56 P45 J55b K44 C56 J45!f S55b J44 J56d C45 P55b J44 K56 C45!c J55rb P44 S56x C45xe K55xb S44x J56r C45 J55b P44 J56 J50b') },
  { id: 'pumpovaci-stroj', name: 'Pumpovací stroj', grade: '6b', color: '#e85f5f', sector: 'preklizka',
    holds: parseHolds('J50 J44 C56 P45 J55b K44 C56 J45 S55b J44r C56 J45!c C55ob P44o J56o C45o K55ob J44o C56o J45r J55b C44 J56 K45!f C55b S44x J56x __ J46xy C55b J45 J50b') }
];
const sectorOf = r => SECTORS.find(s => s.id === r.sector);
const routesIn = sectorId => ROUTES.filter(r => r.sector === sectorId);
// moves = holds you actually climb onto (not the start, not the gap under a dyno)
const routeMoves = r => r.holds.filter((h, j) => j > 0 && !h.gap).length;
function validateRoute(r) {
  const out = [], hs = r.holds, last = hs.length - 1;
  if (!(r.grade in GRADE_LEVEL)) out.push('neznámý stupeň ' + r.grade);
  if (!SECTORS.some(s => s.id === r.sector)) out.push('neznámý sektor ' + r.sector);
  if (hs.length < 10) out.push('cesta je moc krátká');
  if (hs[0].gap || hs[0].t !== 'jug') out.push('start musí být madlo');
  if (hs[last].gap) out.push('top nesmí být mezera');
  if (!hs.some((h, j) => j > 0 && h.bolt)) out.push('chybí jištění');
  hs.forEach((h, j) => {
    if (h.gap) {
      if (!(hs[j + 1] && hs[j + 1].dyno)) out.push('mezera ' + j + ' nemá za sebou dyno');
      if (Object.keys(h).length > 1) out.push('mezera ' + j + ' nesmí mít značky');
      return;
    }
    if (!['jug', 'crimp', 'sloper', 'pinch', 'pocket'].includes(h.t)) out.push('neznámý typ chytu ' + j);
    if (h.x < 0.1 || h.x > 0.9) out.push('chyt ' + j + ' je mimo stěnu');
    if (h.dyno && !(hs[j - 1] && hs[j - 1].gap)) out.push('dyno ' + j + ' nemá před sebou mezeru');
    if (h.dyno && j < 3) out.push('dyno ' + j + ' je moc nízko');
  });
  return out;
}
```

- [ ] **Step 4: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 5: Commit**

```bash
git add adelka.html tests/routes.test.js
git commit -m "Data cest: zápis, 8 cest a kontrola" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Hvězdičky, postup a odemykání

**Files:**
- Modify: `adelka.html` – za blok z Task 2 (za funkci `validateRoute`)
- Test: `tests/progress.test.js`

**Interfaces:**
- Consumes: `ROUTES`, `SECTORS`, `sectorOf`, `routesIn` (Task 2), `store` (existuje).
- Produces: `PROGRESS_KEY`, `loadProgress() → {routeId: stars}`, `saveRouteStars(id, stars) → progress`, `routeStars(falls, perfects, moves) → 1|2|3`, `sectorStars(sectorId, prog) → number`, `isSectorUnlocked(sector, prog) → bool`, `isRouteUnlocked(route, prog) → bool`, `nextRoute(route) → route|null`.

- [ ] **Step 1: Napsat padající testy**

`tests/progress.test.js`:
```js
test('hvězdičky podle pádů a perfektů', () => {
  const s = A('routeStars');
  eq(s(0, 5, 15), 3);
  eq(s(0, 4, 15), 2);
  eq(s(1, 15, 15), 2);
  eq(s(2, 15, 15), 1);
});
test('uložení drží jen nejlepší výsledek', () => {
  localStorage.removeItem('adelka.routes');
  A('saveRouteStars')('rozlez', 2);
  A('saveRouteStars')('rozlez', 1);
  eq(A('loadProgress')(), { rozlez: 2 });
  A('saveRouteStars')('rozlez', 3);
  eq(A('loadProgress')(), { rozlez: 3 });
  localStorage.removeItem('adelka.routes');
});
test('na začátku je odemčená jen první cesta', () => {
  const R = A('ROUTES'), un = A('isRouteUnlocked');
  eq(R.map(r => un(r, {})), [true, false, false, false, false, false, false, false]);
});
test('dolezení odemkne další cestu v sektoru', () => {
  const R = A('ROUTES'), un = A('isRouteUnlocked');
  eq(R.map(r => un(r, { rozlez: 1 })), [true, true, false, false, false, false, false, false]);
});
test('Překližka se odemkne za 6 hvězd z Haly', () => {
  const R = A('ROUTES'), un = A('isRouteUnlocked'), S = A('SECTORS');
  const five = { rozlez: 3, 'mnam-madla': 2 }, six = { rozlez: 3, 'mnam-madla': 3 };
  eq(A('sectorStars')('hala', six), 6);
  eq(A('isSectorUnlocked')(S[1], five), false);
  eq(A('isSectorUnlocked')(S[1], six), true);
  eq(un(R[4], six), true);
  eq(un(R[5], six), false);
});
test('další cesta v pořadí', () => {
  const R = A('ROUTES');
  eq(A('nextRoute')(R[0]).id, 'mnam-madla');
  eq(A('nextRoute')(R[7]), null);
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`routeStars is not defined` apod.).

- [ ] **Step 3: Přidat funkce**

Hned za funkci `validateRoute` vložit:
```js
const PROGRESS_KEY = 'adelka.routes';
function loadProgress() {
  try { return JSON.parse(store.get(PROGRESS_KEY, '{}')) || {}; } catch (e) { return {}; }
}
function saveRouteStars(id, stars) {
  const p = loadProgress();
  if (stars > (p[id] || 0)) { p[id] = stars; store.set(PROGRESS_KEY, JSON.stringify(p)); }
  return p;
}
// ★ topped out, ★★ at most one fall, ★★★ no fall and at least a third of the moves perfect
function routeStars(falls, perfects, moves) {
  if (falls === 0 && perfects * 3 >= moves) return 3;
  return falls <= 1 ? 2 : 1;
}
const sectorStars = (sectorId, prog) => routesIn(sectorId).reduce((n, r) => n + (prog[r.id] || 0), 0);
function isSectorUnlocked(sector, prog) {
  const i = SECTORS.indexOf(sector);
  return i <= 0 || sectorStars(SECTORS[i - 1].id, prog) >= sector.need;
}
function isRouteUnlocked(route, prog) {
  if (!isSectorUnlocked(sectorOf(route), prog)) return false;
  const list = routesIn(route.sector), k = list.indexOf(route);
  return k === 0 || (prog[list[k - 1].id] || 0) >= 1;
}
const nextRoute = r => ROUTES[ROUTES.indexOf(r) + 1] || null;
```

- [ ] **Step 4: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 5: Commit**

```bash
git add adelka.html tests/progress.test.js
git commit -m "Hvězdičky, ukládání postupu a odemykání cest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Režim cesty v herní logice

**Files:**
- Modify: `adelka.html` (funkce `hold`, `ensureBolts`, `diff`, `reset`, `updHUD`, `startGame`, `maybeEye`, `windStep`, `arrive`, `clipDone`, `startFall`, `wallAt`, `drawRoute`, CSS `.chip`)
- Test: `tests/flow.test.js`

**Interfaces:**
- Consumes: `GRADE_LEVEL`, `sectorOf` (Task 2).
- Produces: `G.route` (route|null), `G.falls`, `G.done` (Set), `G.banner` (`{t,title,sub}`|null), `OFF_ROUTE`, `setupRoute(route)`, `startRoute(route)`, `afterHold(i)`, `startEye(i)`, `startGust()`. Hold v režimu cesty má navíc `gap` a `src` (původní zápis chytu). `afterHold` volá `routeTop()` z Task 6.

- [ ] **Step 1: Napsat padající testy**

`tests/flow.test.js`:
```js
test('start cesty postaví stěnu podle zápisu', () => {
  const R = A('ROUTES'), G = A('G');
  A('startRoute')(R[0]);
  eq(G.route.id, 'rozlez');
  eq(A('holds').length, 15);
  eq(A('bolts'), [0, 5, 10]);
  eq(G.items.size, 0);
  ok(A('hold')(40).none, 'nad topem žádné chyty');
  eq(A('diff')(12).speed, 0.5, 'obtížnost 4a je pevná');
  eq(A('$')('grade').textContent, 'Rozlez · 0/14');
});
test('vylepšení a odpočinek podle zápisu', () => {
  const R = A('ROUTES'), G = A('G');
  A('startRoute')(R[1]);
  eq(G.items.get(6).type, 'chalk');
  eq(G.items.get(12).type, 'fried');
  jumpTo(7); G.p = G.zc; A('tap')(); step(0.7);
  eq(G.cur, 8); eq(G.mode, 'rest', 'na chytu 8 se odpočívá');
});
test('na cestě se nic nespouští náhodně', () => {
  const R = A('ROUTES'), G = A('G');
  A('startRoute')(R[0]);
  eq([G.nextDay, G.nextEyeAt, G.nextGustAt, G.nextItemAt], [Infinity, Infinity, Infinity, Infinity]);
  jumpTo(9); G.p = G.zc; A('tap')(); step(0.7);
  eq(G.cur, 10); ok(G.mode === 'clip', 'chyt 10 má jištění');
  A('clipDone')();
  eq(G.mode, 'climb', 'chyt 10 na cestě neodpočívá, i když je desátý');
});
test('pády se počítají', () => {
  const R = A('ROUTES'), G = A('G');
  A('startRoute')(R[0]);
  jumpTo(3); G.p = G.zc > 0.5 ? 0.01 : 0.99; A('tap')();
  eq(G.falls, 1);
});
test('nekonečná stěna po cestě funguje jako dřív', () => {
  const G = A('G');
  A('startRoute')(A('ROUTES')[0]);
  A('startGame')();
  eq(G.route, null);
  ok(A('hold')(30).t && !A('hold')(30).none, 'náhodné chyty');
  ok(A('diff')(30).speed > 0.5, 'obtížnost roste s výškou');
  ok(/ m$/.test(A('$')('grade').textContent), 'HUD ukazuje metry');
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`startRoute is not defined`).

- [ ] **Step 3: `hold`, `ensureBolts`, `diff`**

Nahradit
```js
const holds = [];
function hold(i) {
  while (holds.length <= i) {
```
za
```js
const holds = [];
const OFF_ROUTE = { x: 0.5, s: 0, r: 1, t: 'jug', none: true };   // above the top of a route
function hold(i) {
  if (G.route) return holds[i] || OFF_ROUTE;
  while (holds.length <= i) {
```
Nahradit
```js
function ensureBolts(i) { while (
```
za
```js
function ensureBolts(i) { if (G.route) return; while (
```
Nahradit
```js
function diff(i) {
  i = Math.max(0, i - (G.ease || 0));
```
za
```js
function diff(i) {
  if (G.route) i = GRADE_LEVEL[G.route.grade];   // a route has one fixed difficulty
  i = Math.max(0, i - (G.ease || 0));
```

- [ ] **Step 4: Stav ve `reset`**

Nahradit
```js
function reset() {
  seed = (Math.random() * 1e9) | 0;
```
za
```js
function reset() {
  G.route = null;
  seed = (Math.random() * 1e9) | 0;
```
Nahradit
```js
    mara: null,
```
za
```js
    mara: null, route: null, falls: 0, banner: null, done: new Set(),
```

- [ ] **Step 5: HUD**

Nahradit
```js
  $('grade').textContent = gradeAt(G.cur) + ' · ' + Math.round(G.cur * METERS_PER_HOLD) + ' m';
```
za
```js
  $('grade').textContent = G.route
    ? G.route.name + ' · ' + G.cur + '/' + (G.route.holds.length - 1)
    : gradeAt(G.cur) + ' · ' + Math.round(G.cur * METERS_PER_HOLD) + ' m';
```
V CSS nahradit
```css
  font-variant-numeric:tabular-nums;white-space:nowrap;text-shadow:none;
}
```
za
```css
  font-variant-numeric:tabular-nums;white-space:nowrap;text-shadow:none;
  max-width:46vw;overflow:hidden;text-overflow:ellipsis;
}
```

- [ ] **Step 6: `startGame` schová všechny překryvy a přibude `setupRoute` + `startRoute`**

Nahradit
```js
  $('menu').hidden = true; $('over').hidden = true; $('boardView').hidden = true; $('hud').hidden = false;
```
za
```js
  for (const id of ['menu', 'over', 'boardView', 'guide', 'routeEnd']) { const el = $(id); if (el) el.hidden = true; }
  $('hud').hidden = false;
```
Hned za konec funkce `startGame` (za řádek `  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}` a jeho `}`) vložit:
```js
// a route replaces the generated wall: holds, bolts and items come from its notation, nothing random happens
function setupRoute(route) {
  G.route = route;
  holds.length = 0;
  route.holds.forEach((h, j) => holds.push({
    x: h.gap ? 0.5 : h.x, s: (hr(j, 2) * 100000) | 0, r: 0.85 + hr(j, 3) * 0.35,
    t: h.t || 'jug', gap: !!h.gap, src: h
  }));
  bolts.length = 0; bolts.push(0);
  route.holds.forEach((h, j) => { if (h.bolt && j > 0) bolts.push(j); });
  G.items = new Map();
  route.holds.forEach((h, j) => { if (h.item) G.items.set(j, { type: h.item, state: 'wall', t: 0 }); });
  G.nextItemAt = Infinity; G.nextEyeAt = Infinity; G.nextGustAt = Infinity; G.nextDay = Infinity;
  G.hint = 0;
  routeColor = route.color;
  G.sx = holdX(0); G.sy = holdY(0); G.camY = holdY(0);
  G.banner = { t: 0, title: route.name, sub: route.grade };
}
function startRoute(route) {
  startGame();
  setupRoute(route);
  newZone();
  updHUD();
}
```

- [ ] **Step 7: Rozdělit `maybeEye` a `windStep`**

Nahradit
```js
function maybeEye(i) {
  if (i < G.nextEyeAt || G.eye) return;
  if (outdoors(i) || G.wind > 0) { G.nextEyeAt = i + 3; return; }
  const side = holdX(i) < W / 2 ? 1 : -1;
```
za
```js
function maybeEye(i) {
  if (i < G.nextEyeAt || G.eye) return;
  if (outdoors(i) || G.wind > 0) { G.nextEyeAt = i + 3; return; }
  startEye(i);
  G.nextEyeAt = i + 12 + Math.floor(Math.random() * 9);
}
function startEye(i) {
  const side = holdX(i) < W / 2 ? 1 : -1;
```
a v téže (nyní `startEye`) funkci odstranit poslední řádek
```js
  G.nextEyeAt = i + 12 + Math.floor(Math.random() * 9);
}
function windStep(i) {
```
→ nahradit za
```js
}
function windStep(i) {
```
Pak nahradit
```js
  if (i >= G.nextGustAt) {
    G.wind = 3 + Math.floor(Math.random() * 2);
    G.nextGustAt = i + G.wind + 6 + Math.floor(Math.random() * 5);
    say('Fouká!', 1.1);
    noise(0.9, 0.08, 500);
  }
}
```
za
```js
  if (i >= G.nextGustAt) {
    startGust();
    G.nextGustAt = i + G.wind + 6 + Math.floor(Math.random() * 5);
  }
}
function startGust() {
  G.wind = 3 + Math.floor(Math.random() * 2);
  say('Fouká!', 1.1);
  noise(0.9, 0.08, 500);
}
```

- [ ] **Step 8: `afterHold` a úprava `arrive` / `clipDone`**

Nahradit
```js
  windStep(i);
  newZone();
```
za
```js
  if (G.route) { if (G.wind > 0) G.wind--; } else windStep(i);
  newZone();
```
Nahradit
```js
  if (isBolt(i) && !G.clipped.has(i)) startClip(i);
  else if (i % 10 === 0 && i > G.lastRest) startRest(i);
  else if (i >= G.nextDay) startDay(i);
  else { G.mode = 'climb'; G.pose = 'idle'; maybeEye(i); }
}
function startClip(i) {
```
za
```js
  if (isBolt(i) && !G.clipped.has(i)) startClip(i);
  else afterHold(i);
}
// once Adélka holds on: on a route the hold's own marks decide, on the endless wall the usual rhythm
function afterHold(i) {
  if (G.route) {
    const h = hold(i).src || {};
    if (i === G.route.holds.length - 1) { routeTop(); return; }
    if (h.rest && i > G.lastRest) { startRest(i); return; }
    if (h.day && !G.done.has('day' + i)) { G.done.add('day' + i); startDay(i); return; }
    G.mode = 'climb'; G.pose = 'idle';
    if (h.eye && !G.done.has('eye' + i)) { G.done.add('eye' + i); startEye(i); }
    if (h.wind && !G.done.has('wind' + i)) { G.done.add('wind' + i); startGust(); }
    return;
  }
  if (i % 10 === 0 && i > G.lastRest) startRest(i);
  else if (i >= G.nextDay) startDay(i);
  else { G.mode = 'climb'; G.pose = 'idle'; maybeEye(i); }
}
function startClip(i) {
```
Nahradit
```js
  chalk(b.cx, b.cy, 6, 80);
  if (i % 10 === 0 && i > G.lastRest) startRest(i);
  else if (i >= G.nextDay) startDay(i);
  else { G.mode = 'climb'; G.pose = 'idle'; maybeEye(i); }
}
```
za
```js
  chalk(b.cx, b.cy, 6, 80);
  afterHold(i);
}
```

- [ ] **Step 9: Počítání pádů, stěna podle sektoru, mezery se nekreslí**

Nahradit
```js
  G.lives--; updHUD();
```
za
```js
  G.lives--; G.falls++; updHUD();
```
Nahradit
```js
const wallAt = wy => WALLS[Math.max(0, Math.floor(-wy / (SECTION * S))) % WALLS.length];
```
za
```js
const wallAt = wy => G.route ? WALLS[sectorOf(G.route).wall] : WALLS[Math.max(0, Math.floor(-wy / (SECTION * S))) % WALLS.length];
```
Nahradit
```js
    const h = hold(i), x = holdX(i), y = toSY(holdY(i));
    if (i === G.cur + 1 &&
```
za
```js
    const h = hold(i), x = holdX(i), y = toSY(holdY(i));
    if (h.gap || h.none) continue;
    if (i === G.cur + 1 &&
```

- [ ] **Step 10: Spustit testy**

Expected: všechny `PASS` (včetně Task 1–3).

- [ ] **Step 11: Commit**

```bash
git add adelka.html tests/flow.test.js
git commit -m "Režim cesty: stěna, jištění a události podle zápisu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Průvodce, menu a cedulka na startu

**Files:**
- Modify: `adelka.html` (HTML menu, nový překryv `#guide`, CSS, funkce `renderGuide`, `openGuide`, `drawBanner`, `update`, `draw`, obsluha tlačítek)
- Test: `tests/guide.test.js`

**Interfaces:**
- Consumes: `SECTORS`, `ROUTES`, `routesIn` (Task 2), `loadProgress`, `sectorStars`, `isSectorUnlocked`, `isRouteUnlocked` (Task 3), `startRoute`, `G.banner` (Task 4).
- Produces: `renderGuide()`, `openGuide()`, `drawBanner()`; DOM `#guide`, `#guideList`, `#guideStars`, `#guideBack`, `#routesBtn`, řádky `.route-row[data-route]`.

- [ ] **Step 1: Napsat padající testy**

`tests/guide.test.js`:
```js
test('průvodce ukáže 2 sektory a 8 cest, odemčená jen první', () => {
  localStorage.removeItem('adelka.routes');
  A('openGuide')();
  const rows = [...document.querySelectorAll('#guideList .route-row')];
  eq(rows.length, 8);
  eq(rows.map(b => b.disabled), [false, true, true, true, true, true, true, true]);
  eq(document.querySelectorAll('#guideList .sector').length, 2);
  ok(/6 ★/.test(document.querySelectorAll('#guideList .sector p')[1].textContent), 'Překližka říká, za kolik hvězd');
  eq(A('$')('guide').hidden, false);
});
test('dolezená cesta má hvězdičky a odemkne další', () => {
  localStorage.setItem('adelka.routes', JSON.stringify({ rozlez: 2 }));
  A('renderGuide')();
  const rows = [...document.querySelectorAll('#guideList .route-row')];
  eq(rows[0].querySelector('.rstars').textContent, '★★☆');
  eq(rows[1].disabled, false);
  eq(A('$')('guideStars').textContent, '2 ★');
  localStorage.removeItem('adelka.routes');
});
test('klik na cestu ji spustí', () => {
  localStorage.removeItem('adelka.routes');
  A('openGuide')();
  document.querySelector('#guideList .route-row[data-route="rozlez"]').click();
  eq(A('G').route.id, 'rozlez');
  eq(A('$')('guide').hidden, true);
  ok(A('G').banner && A('G').banner.title === 'Rozlez', 'cedulka se jménem');
});
test('menu má tlačítko Cesty a Nekonečná stěna', () => {
  eq(A('$')('routesBtn').textContent, 'Cesty');
  eq(A('$')('play').textContent, 'Nekonečná stěna');
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`openGuide is not defined`).

- [ ] **Step 3: HTML**

V menu nahradit
```html
      <button class="btn primary" id="play" type="button">Lézt!</button>
```
za
```html
      <button class="btn primary" id="routesBtn" type="button">Cesty</button>
      <button class="btn" id="play" type="button">Nekonečná stěna</button>
```
Těsně před řádek `<script src="zvuky.js"></script>` vložit:
```html
<div class="overlay" id="guide" hidden>
  <div class="card">
    <div class="tape blue"><span>Průvodce</span><span id="guideStars">0 ★</span></div>
    <h2>Cesty</h2>
    <div class="guide-list" id="guideList"></div>
    <div class="btns"><button class="btn" id="guideBack" type="button">Zpět</button></div>
  </div>
</div>
```

- [ ] **Step 4: CSS**

Před řádek `@media (prefers-reduced-motion: reduce){ .life{transition:none} }` vložit:
```css
.guide-list{display:flex;flex-direction:column;gap:16px}
.sector{display:flex;flex-direction:column;gap:6px}
.sector-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.sector-head h3{margin:0;font-family:var(--font-display);font-weight:800;font-size:20px}
.sector-head span{font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}
.sector p{margin:0 0 2px;font-size:14px;color:var(--muted);font-weight:700}
.route-row{display:grid;grid-template-columns:14px 1fr auto 4.2em;align-items:center;gap:10px;width:100%;min-height:48px;padding:6px 12px;border-radius:12px;border:2px solid #d5dde4;background:#fff;color:var(--ink);font:700 15px var(--font-body);text-align:left;cursor:pointer}
.route-row:disabled{opacity:.5;cursor:default}
.route-row:focus-visible{outline:3px solid var(--perfect);outline-offset:2px}
.route-row .swatch{width:14px;height:14px;border-radius:4px}
.route-row .rname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.route-row .rgrade{font-family:var(--font-display);font-weight:800}
.route-row .rstars{color:var(--hold);text-align:right;font-size:14px}
```

- [ ] **Step 5: Funkce průvodce a cedulky**

Hned za funkci `startRoute` (Task 4) vložit:
```js
function renderGuide() {
  const prog = loadProgress(), list = $('guideList');
  list.textContent = '';
  let total = 0;
  for (const s of SECTORS) {
    const open = isSectorUnlocked(s, prog), got = sectorStars(s.id, prog), routes = routesIn(s.id);
    total += got;
    const sec = document.createElement('section'); sec.className = 'sector';
    const head = document.createElement('div'); head.className = 'sector-head';
    const h3 = document.createElement('h3'); h3.textContent = s.name;
    const cnt = document.createElement('span'); cnt.textContent = got + '/' + routes.length * 3 + ' ★';
    head.append(h3, cnt);
    const p = document.createElement('p');
    p.textContent = open ? s.desc : 'Odemkne se za ' + s.need + ' ★ z předchozího sektoru.';
    sec.append(head, p);
    for (const r of routes) {
      const unlocked = isRouteUnlocked(r, prog), st = prog[r.id] || 0;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'route-row'; b.disabled = !unlocked; b.dataset.route = r.id;
      const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = r.color;
      const nm = document.createElement('span'); nm.className = 'rname'; nm.textContent = r.name;
      const gr = document.createElement('span'); gr.className = 'rgrade'; gr.textContent = r.grade;
      const sts = document.createElement('span'); sts.className = 'rstars';
      sts.textContent = unlocked ? '★'.repeat(st) + '☆'.repeat(3 - st) : 'zamčeno';
      b.append(sw, nm, gr, sts);
      b.addEventListener('click', () => startRoute(r));
      sec.append(b);
    }
    list.append(sec);
  }
  $('guideStars').textContent = total + ' ★';
}
function openGuide() {
  renderGuide();
  for (const id of ['menu', 'over', 'routeEnd', 'hud']) { const el = $(id); if (el) el.hidden = true; }
  $('guide').hidden = false;
}
// the sign at the foot of a route: its name and grade, shown for a moment at the start
function drawBanner() {
  const bn = G.banner;
  if (!bn) return;
  const a = Math.min(1, bn.t / 0.25, (2.2 - bn.t) / 0.4);
  const w = Math.min(W - 48, 300), x = (W - w) / 2, y = safeT + 120;
  ctx.save(); ctx.globalAlpha = Math.max(0, a);
  ctx.fillStyle = '#f6f8fa'; rr(x, y, w, 74, 14); ctx.fill();
  ctx.fillStyle = G.route ? G.route.color : '#ff7a2f'; rr(x, y, w, 16, 8); ctx.fill(); ctx.fillRect(x, y + 8, w, 8);
  ctx.fillStyle = '#1d2b3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 24px "Baloo 2", system-ui, sans-serif'; ctx.fillText(bn.title, W / 2, y + 40);
  ctx.font = '800 15px Nunito, system-ui, sans-serif'; ctx.fillText(bn.sub, W / 2, y + 62);
  ctx.restore();
}
```
Nahradit
```js
  if (G.mara) { G.mara.t += dt; if (G.mara.t > G.mara.dur) G.mara = null; }
```
za
```js
  if (G.mara) { G.mara.t += dt; if (G.mara.t > G.mara.dur) G.mara = null; }
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.2) G.banner = null; }
```
Nahradit
```js
  drawUI();
  drawMara();
```
za
```js
  drawUI();
  drawMara();
  drawBanner();
```
Za řádek `$('closeBoard').addEventListener('click', () => { $('boardView').hidden = true; $('menu').hidden = false; });` vložit:
```js
$('routesBtn').addEventListener('click', openGuide);
$('guideBack').addEventListener('click', () => { $('guide').hidden = true; $('menu').hidden = false; });
```

- [ ] **Step 6: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 7: Commit**

```bash
git add adelka.html tests/guide.test.js
git commit -m "Průvodce cestami, nové menu a cedulka na startu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Top, spuštění, výsledek a neúspěch

**Files:**
- Modify: `adelka.html` (`routeTop`, `lowerFromTop`, `routeFinish`, `update` case `'top'`, `updateFall` větev `landed`, `gameOver`, `drawRoute` cedulka TOP, překryv `#routeEnd`, CSS, tlačítka)
- Test: `tests/finish.test.js`

**Interfaces:**
- Consumes: `routeStars`, `saveRouteStars`, `loadProgress`, `isRouteUnlocked`, `nextRoute`, `routeMoves` (Task 2–3), `startRoute`, `G.falls` (Task 4), `openGuide` (Task 5).
- Produces: `routeTop()`, `lowerFromTop()`, `routeFinish(ok)`, proměnná `lastRoute`; DOM `#routeEnd`, `#routeEndTape`, `#routeEndTitle`, `#routeEndStars`, `#routeEndDetail`, `#routeNext`, `#routeRetry`, `#routeGuide`.

- [ ] **Step 1: Napsat padající testy**

`tests/finish.test.js`:
```js
test('dolezení bez pádu = 3 hvězdy, uloží se a nabídne další cestu', async () => {
  localStorage.removeItem('adelka.routes');
  const G = A('G');
  A('startRoute')(A('ROUTES')[0]);
  climbPerfect(100);
  eq(G.mode, 'top');
  step(1.8);  // celebration, then lowering starts
  step(4);    // lowered to the ground
  eq(G.mode, 'over');
  await sleep(800);
  eq(A('$')('routeEnd').hidden, false);
  eq(A('$')('routeEndTitle').textContent, 'Top!');
  eq(A('$')('routeEndStars').textContent, '★★★');
  eq(A('loadProgress')(), { rozlez: 3 });
  eq(A('$')('routeNext').hidden, false);
  localStorage.removeItem('adelka.routes');
});
test('3 pády = Neprošlo to a nic se neuloží', async () => {
  localStorage.removeItem('adelka.routes');
  const G = A('G');
  A('startRoute')(A('ROUTES')[0]);
  for (let k = 0; k < 3 && G.mode !== 'over'; k++) {
    for (let w = 0; w < 200 && G.mode !== 'climb' && G.mode !== 'over'; w++) step(0.1);
    G.p = G.zc > 0.5 ? 0.01 : 0.99; A('tap')();
    step(6);
  }
  eq(G.mode, 'over');
  await sleep(800);
  eq(A('$')('routeEndTitle').textContent, 'Neprošlo to');
  eq(A('$')('routeEndStars').hidden, true);
  eq(A('$')('routeNext').hidden, true);
  eq(A('loadProgress')(), {});
});
test('Zkusit znovu spustí stejnou cestu od začátku', () => {
  A('$')('routeRetry').click();
  eq(A('G').route.id, 'rozlez');
  eq(A('G').cur, 0);
  eq(A('G').falls, 0);
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`routeTop is not defined` při dolezení).

- [ ] **Step 3: HTML a CSS výsledku**

Těsně před řádek `<script src="zvuky.js"></script>` vložit:
```html
<div class="overlay" id="routeEnd" hidden>
  <div class="card">
    <div class="tape"><span id="routeEndTape">Cesta</span><span>Výsledek</span></div>
    <h2 id="routeEndTitle">Top!</h2>
    <p class="route-stars" id="routeEndStars">★★★</p>
    <p class="detail" id="routeEndDetail"></p>
    <div class="btns">
      <button class="btn primary" id="routeNext" type="button">Další cesta</button>
      <button class="btn" id="routeRetry" type="button">Zkusit znovu</button>
      <button class="btn" id="routeGuide" type="button">Průvodce</button>
    </div>
  </div>
</div>
```
Před řádek `@media (prefers-reduced-motion: reduce){ .life{transition:none} }` vložit:
```css
.route-stars{margin:-4px 0 0;font-family:var(--font-display);font-size:38px;line-height:1;color:var(--hold);letter-spacing:.08em}
```

- [ ] **Step 4: Logika topu a konce**

Hned za funkci `drawBanner` (Task 5) vložit:
```js
let lastRoute = null;
function routeTop() {
  G.mode = 'top'; G.topT = 0; G.pose = 'sheepish'; G.face = 1.5;
  say('Top!', 1.4);
  maraSay(['Kedlubna!'], 0.3);
  SFX.clip(); SFX.start();   // clipping the lower-off, then the fanfare
  floater('TOP!', '#ffd23f', holdX(G.cur), holdY(G.cur) - S * 0.5, 34);
  chalk(G.sx, G.sy, 14, 120);
}
// after the top Mára lowers her straight to the mat
function lowerFromTop() {
  const hOff = 94 * K * SEAL, y0 = G.sy + hOff;
  G.mode = 'fall';
  G.anim = { t: 0, phase: 'lower', top: true, lc: G.lastClip, hOff, hx: G.sx, hy: y0, x0: G.sx, y0, gy: hOff, dl: Math.max(0.6, (hOff - y0) / (S * 14)) };
  SFX.lower();
  maraSay(MARA.lower, 0.2);
}
function routeFinish(ok) {
  const r = G.route;
  lastRoute = r;
  G.mode = 'over'; G.pose = 'sheepish';
  if (!ok) SFX.over();
  setMusicLevel(0.35); setMusicLevel(1, 3);
  const moves = routeMoves(r), stars = ok ? routeStars(G.falls, G.perfects, moves) : 0;
  const prog = ok ? saveRouteStars(r.id, stars) : loadProgress(), next = nextRoute(r);
  $('routeEndTape').textContent = r.name + ' · ' + r.grade;
  $('routeEndTitle').textContent = ok ? 'Top!' : 'Neprošlo to';
  $('routeEndStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('routeEndStars').hidden = !ok;
  $('routeEndDetail').textContent = 'pády: ' + G.falls + ' · perfektní chyty: ' + G.perfects + ' z ' + moves;
  $('routeNext').hidden = !(ok && next && isRouteUnlocked(next, prog));
  setTimeout(() => { if (G.mode === 'over') { $('routeEnd').hidden = false; $('hud').hidden = true; } }, 700);
}
```
Nahradit
```js
    case 'fall':
      updateFall(dt);
      break;
```
za
```js
    case 'fall':
      updateFall(dt);
      break;
    case 'top':
      G.topT += dt;
      G.sx = holdX(G.cur); G.sy = holdY(G.cur);
      if (G.topT > 1.6) lowerFromTop();
      break;
```
Nahradit
```js
    if (a.t > 0.5) { G.anim = null; G.tilt = null; G.sx = holdX(0); G.sy = holdY(0); gameOver(); return; }
```
za
```js
    if (a.t > 0.5) { G.anim = null; G.tilt = null; G.sx = holdX(0); G.sy = holdY(0); if (a.top) routeFinish(true); else gameOver(); return; }
```
Nahradit
```js
function gameOver() {
```
za
```js
function gameOver() {
  if (G.route) { routeFinish(false); return; }
```
Za řádek `$('guideBack').addEventListener(...)` (Task 5) vložit:
```js
$('routeNext').addEventListener('click', () => startRoute(nextRoute(lastRoute)));
$('routeRetry').addEventListener('click', () => startRoute(lastRoute));
$('routeGuide').addEventListener('click', openGuide);
```

- [ ] **Step 5: Cedulka TOP u posledního chytu**

V `drawRoute` nahradit
```js
      ctx.fillText('START', 0, 1);
      ctx.restore();
    }
```
za
```js
      ctx.fillText('START', 0, 1);
      ctx.restore();
    }
    if (G.route && i === G.route.holds.length - 1) {
      ctx.save(); ctx.translate(x, y - S * 0.32); ctx.rotate(0.06);
      ctx.fillStyle = routeColor; ctx.fillRect(-20, -8, 40, 16);
      ctx.fillStyle = '#1d2b3a'; ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TOP', 0, 1);
      ctx.restore();
    }
```

- [ ] **Step 6: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 7: Commit**

```bash
git add adelka.html tests/finish.test.js
git commit -m "Top cesty, spuštění, výsledek s hvězdičkami a neúspěch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Převis

**Files:**
- Modify: `adelka.html` (`ROOF`, `isRoof`, `moveDiff`, `tap`, `update` case `'climb'`, `afterHold`, `drawSeal`, nová `drawRoofs`, `draw`)
- Test: `tests/roof.test.js`

**Interfaces:**
- Consumes: `hold(i).src.roof` (Task 2 + 4).
- Produces: `ROOF = { speed: 1.2, cost: 1.5, drain: 2 }`, `isRoof(i) → bool`, `drawRoofs()`.

- [ ] **Step 1: Napsat padající testy**

`tests/roof.test.js`:
```js
// route 5 "Převislá kytara": roof on holds 9–13
test('v převisu jede jezdec o 20 % rychleji', () => {
  A('startRoute')(A('ROUTES')[4]);
  jumpTo(8);
  const d = A('moveDiff')(), base = A('diff')(9).speed * (A('HOLD_MODS')[A('hold')(9).t].speed || 1);
  eq(+(d.speed / base).toFixed(2), 1.2);
});
test('chyt v převisu stojí 1,5× víc síly', () => {
  const G = A('G');
  A('startRoute')(A('ROUTES')[4]);
  jumpTo(8); G.pump = 100;
  G.p = Math.min(0.999, G.zc + A('moveDiff')().zone / 2 * 0.85); A('tap')();
  eq(+(100 - G.pump).toFixed(1), A('PUMP_COST')[A('hold')(9).t] * 1.5);
});
test('visení v převisu ubírá sílu 2× rychleji', () => {
  const G = A('G');
  A('startRoute')(A('ROUTES')[4]);
  jumpTo(10); G.pump = 80; G.hang = 999;
  A('update')(1);
  eq(+(80 - G.pump).toFixed(1), 6);
});
test('mimo převis se nic nemění', () => {
  A('startRoute')(A('ROUTES')[4]);
  jumpTo(2);
  eq(A('isRoof')(3), false);
  const d = A('moveDiff')(), base = A('diff')(3).speed * (A('HOLD_MODS')[A('hold')(3).t].speed || 1);
  eq(+(d.speed / base).toFixed(2), 1);
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`isRoof is not defined` / poměr 1).

- [ ] **Step 3: Pravidla převisu**

Nahradit
```js
function moveDiff() {
```
za
```js
// overhang on a route: faster slider, every hold costs more, hanging drains faster
const ROOF = { speed: 1.2, cost: 1.5, drain: 2 };
const isRoof = i => !!(G.route && hold(i).src && hold(i).src.roof);
function moveDiff() {
```
Nahradit
```js
  return { speed: d.speed * (m.speed || 1), zone, perf: Math.max(0.014, zone * 0.18), drift, bonus: m.bonus || 1 };
```
za
```js
  return { speed: d.speed * (m.speed || 1) * (isRoof(i) ? ROOF.speed : 1), zone, perf: Math.max(0.014, zone * 0.18), drift, bonus: m.bonus || 1 };
```
Nahradit
```js
    const cost = PUMP_COST[hold(G.cur + 1).t] || 8;
```
za
```js
    const cost = (PUMP_COST[hold(G.cur + 1).t] || 8) * (isRoof(G.cur + 1) ? ROOF.cost : 1);
```
Nahradit
```js
        G.pump -= PUMP_DRAIN * dt;
```
za
```js
        G.pump -= PUMP_DRAIN * (isRoof(G.cur) ? ROOF.drain : 1) * dt;
```
V `afterHold` nahradit
```js
    const h = hold(i).src || {};
    if (i === G.route.holds.length - 1) { routeTop(); return; }
```
za
```js
    const h = hold(i).src || {};
    if (i > 0 && isRoof(i - 1) && !isRoof(i)) say('Uf!', 1.1);
    if (i === G.route.holds.length - 1) { routeTop(); return; }
```

- [ ] **Step 4: Vzhled převisu**

V `drawSeal` nahradit
```js
  if (G.tilt != null) tilt = G.tilt;
```
za
```js
  if (G.tilt != null) tilt = G.tilt;
  else if (isRoof(G.cur) && pose !== 'fall') tilt += 0.1 + Math.sin(t * 1.5) * 0.06;
```
a (nohy se v převisu houpou víc)
```js
(pose === 'reach' ? 0.3 : Math.sin(t * 2.3) * 0.08);
```
za
```js
(pose === 'reach' ? 0.3 : Math.sin(t * (isRoof(G.cur) ? 3.2 : 2.3)) * (isRoof(G.cur) ? 0.35 : 0.08));
```
Hned před `function drawGround() {` vložit:
```js
// overhangs: a darker, shaded band of wall with a light top lip and a dark bottom edge
function drawRoofs() {
  if (!G.route) return;
  const hs = G.route.holds;
  for (let a = 0; a < hs.length; a++) {
    if (!hs[a].roof || (a > 0 && hs[a - 1].roof)) continue;
    let b = a;
    while (b + 1 < hs.length && hs[b + 1].roof) b++;
    const yTop = toSY(holdY(b) - S * 0.55), yBot = toSY(holdY(a) + S * 0.55);
    if (yBot < -20 || yTop > H + 20) continue;
    ctx.fillStyle = 'rgba(5,12,20,.32)'; ctx.fillRect(0, yTop, W, yBot - yTop);
    const g = ctx.createLinearGradient(0, yTop, 0, yTop + S * 0.5);
    g.addColorStop(0, 'rgba(5,12,20,.45)'); g.addColorStop(1, 'rgba(5,12,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, yTop, W, S * 0.5);
    ctx.fillStyle = 'rgba(246,248,250,.35)'; ctx.fillRect(0, yTop - 2, W, 3);
    ctx.fillStyle = 'rgba(5,12,20,.6)'; ctx.fillRect(0, yBot - 3, W, 6);
  }
}
```
Nahradit
```js
drawVolumes(); drawGround();
```
za
```js
drawVolumes(); drawRoofs(); drawGround();
```

- [ ] **Step 5: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 6: Commit**

```bash
git add adelka.html tests/roof.test.js
git commit -m "Převis: rychlejší jezdec, dražší chyty, rychlejší pumpa" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Dyno a klíčové místo

**Files:**
- Modify: `adelka.html` (`isDyno`, `isCrux`, `nextIdx`, `moveDiff`, `tap`, `startMove`, `drawRoute`, `drawSeal`, `drawUI`)
- Test: `tests/dyno.test.js`

**Interfaces:**
- Consumes: `hold(i).gap`, `hold(i).src.dyno`, `hold(i).src.crux` (Task 2 + 4), `ROOF`, `isRoof` (Task 7).
- Produces: `isDyno(i)`, `isCrux(i)`, `nextIdx()` – index chytu, na který vede příští tah.

- [ ] **Step 1: Napsat padající testy**

`tests/dyno.test.js`:
```js
// route 6 "Dobeeeer": gap at 11, dyno onto 12
test('příští tah přes mezeru vede na dyno', () => {
  A('startRoute')(A('ROUTES')[5]);
  jumpTo(10);
  eq(A('nextIdx')(), 12);
  jumpTo(8);
  eq(A('nextIdx')(), 9);
});
test('u dyna je jen zelená zóna', () => {
  A('startRoute')(A('ROUTES')[5]);
  jumpTo(10);
  const d = A('moveDiff')();
  eq(+d.zone.toFixed(4), +(d.perf * 2).toFixed(4));
});
test('perfektní trefa přeskočí 2 chyty', () => {
  const G = A('G');
  A('startRoute')(A('ROUTES')[5]);
  jumpTo(10); G.pump = 100;
  G.p = G.zc; A('tap')();
  step(1);
  eq(G.cur, 12);
  eq(G.falls, 0);
});
test('trefa mimo zelenou u dyna = pád', () => {
  const G = A('G');
  A('startRoute')(A('ROUTES')[5]);
  jumpTo(10); G.pump = 100;
  const d = A('moveDiff')();
  G.p = Math.min(0.999, G.zc + d.perf * 1.6);
  A('tap')();
  eq(G.falls, 1);
});
test('klíčové místo je označené', () => {
  A('startRoute')(A('ROUTES')[3]);
  eq([14, 15, 16, 17, 18].map(A('isCrux')), [false, true, true, true, false]);
});
```

- [ ] **Step 2: Ověřit, že testy padají**

Expected: nové testy `FAIL` (`nextIdx is not defined`).

- [ ] **Step 3: Pomocné funkce a `moveDiff`**

Nahradit
```js
const isRoof = i => !!(G.route && hold(i).src && hold(i).src.roof);
```
za
```js
const isRoof = i => !!(G.route && hold(i).src && hold(i).src.roof);
const isDyno = i => !!(G.route && hold(i).src && hold(i).src.dyno);
const isCrux = i => !!(G.route && hold(i).src && hold(i).src.crux);
// the hold the next move goes to: over a gap that is the dyno hold two up
const nextIdx = () => hold(G.cur + 1).gap ? G.cur + 2 : G.cur + 1;
```
Nahradit
```js
  const i = G.cur + 1, d = diff(i), m = HOLD_MODS[hold(i).t] || {}, fx = G.fx || {};
```
za
```js
  const i = nextIdx(), d = diff(i), m = HOLD_MODS[hold(i).t] || {}, fx = G.fx || {};
```
Nahradit
```js
  return { speed: d.speed * (m.speed || 1) * (isRoof(i) ? ROOF.speed : 1), zone, perf: Math.max(0.014, zone * 0.18), drift, bonus: m.bonus || 1 };
```
za
```js
  const perf = Math.max(0.014, zone * 0.18);
  // a dyno only goes with a perfect hit: the yellow zone shrinks to the green centre
  return { speed: d.speed * (m.speed || 1) * (isRoof(i) ? ROOF.speed : 1), zone: isDyno(i) ? perf * 2 : zone, perf, drift, bonus: m.bonus || 1 };
```

- [ ] **Step 4: `tap` a `startMove` jdou na `nextIdx()`**

Nahradit
```js
  const d = moveDiff();
  const off = Math.abs(G.p - G.zc);
```
za
```js
  const d = moveDiff(), to = nextIdx();
  const off = Math.abs(G.p - G.zc);
```
Nahradit
```js
    const it = G.items.get(G.cur + 1), perfect = off <= d.perf;
    if (it && it.state === 'wall') { if (perfect) takeItem(G.cur + 1, it); else { it.state = 'lost'; it.t = 0; } }
```
za
```js
    const it = G.items.get(to), perfect = off <= d.perf;
    if (it && it.state === 'wall') { if (perfect) takeItem(to, it); else { it.state = 'lost'; it.t = 0; } }
```
Nahradit
```js
      floater('PERFEKTNÍ! +' + d.bonus, '#3fd16b', holdX(G.cur + 1), holdY(G.cur + 1) - S * 0.35, 26);
```
za
```js
      floater('PERFEKTNÍ! +' + d.bonus, '#3fd16b', holdX(to), holdY(to) - S * 0.35, 26);
```
Nahradit
```js
    const cost = (PUMP_COST[hold(G.cur + 1).t] || 8) * (isRoof(G.cur + 1) ? ROOF.cost : 1);
    G.pump = Math.min(100, G.pump - (perfect ? cost / 2 - PUMP_PERFECT_BACK : cost));
    if (G.pump <= 0) { pumpedOff(); return; }
    startMove(G.cur + 1);
```
za
```js
    const cost = (PUMP_COST[hold(to).t] || 8) * (isRoof(to) ? ROOF.cost : 1);
    G.pump = Math.min(100, G.pump - (perfect ? cost / 2 - PUMP_PERFECT_BACK : cost));
    if (G.pump <= 0) { pumpedOff(); return; }
    if (isDyno(to)) maraSay(['Hezky!'], 0.4);
    startMove(to);
```
Nahradit
```js
  G.anim = { to, t: 0, d: 0.3, x0: G.sx, y0: G.sy, x1: holdX(to), y1: holdY(to) };
```
za
```js
  G.anim = { to, t: 0, d: isDyno(to) ? 0.55 : 0.3, x0: G.sx, y0: G.sy, x1: holdX(to), y1: holdY(to) };
```

- [ ] **Step 5: Vzhled dyna a klíčového místa**

V `drawRoute` nahradit
```js
    if (i === G.cur + 1 &&
```
za
```js
    if (i === nextIdx() &&
```
a
```js
      ctx.strokeStyle = 'rgba(246,248,250,' + (0.35 + pulse * 0.4) + ')'; ctx.lineWidth = 2.5;
```
za
```js
      ctx.strokeStyle = (isDyno(i) ? 'rgba(255,138,31,' : 'rgba(246,248,250,') + (0.35 + pulse * 0.4) + ')';
      ctx.lineWidth = isDyno(i) ? 4 : 2.5;
```
V `drawSeal` nahradit
```js
, y = toSY(G.sy);
  ctx.save(); ctx.translate(x, y); ctx.scale(K * SEAL, K * SEAL);
```
za
```js
, y = toSY(G.sy) + (G.mode === 'climb' && isDyno(nextIdx()) ? 6 * K : 0);   // crouches before a dyno
  ctx.save(); ctx.translate(x, y); ctx.scale(K * SEAL, K * SEAL);
```
V `drawUI` nahradit
```js
    else drawEffects(b);
```
za
```js
    else drawEffects(b);
    if (isCrux(nextIdx())) outlinedText('Klíčové místo', W / 2, b.y - 64, 16, '#ffd23f');
```

- [ ] **Step 6: Spustit testy**

Expected: všechny `PASS`.

- [ ] **Step 7: Commit**

```bash
git add adelka.html tests/dyno.test.js
git commit -m "Dyno přes mezeru jen perfektem a označení klíčového místa" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Celková kontrola, ukázka a publikace

**Files:**
- Test: `tests/routes-all.test.js`
- Generate: `docs/index.html` (přes `tools/make_web.py`)

- [ ] **Step 1: Test, že všechny cesty jdou dolezt**

`tests/routes-all.test.js`:
```js
test('každá cesta jde dolezt bez pádu na 3 hvězdy', () => {
  const G = A('G'), R = A('ROUTES');
  for (const r of R) {
    A('startRoute')(r);
    climbPerfect(200);
    eq(G.mode, 'top', r.id + ' dosáhla topu');
    eq(G.falls, 0, r.id + ' bez pádu');
    eq(A('routeStars')(G.falls, G.perfects, A('routeMoves')(r)), 3, r.id + ' na 3 hvězdy');
  }
});
```

- [ ] **Step 2: Spustit celou sadu**

Expected: všechny `PASS`. Pokud některá cesta skončí pádem kvůli pumpě, upravit zápis té cesty (přidat `r` na madlo před nejdelším úsekem bez odpočinku) a commitnout opravu.

- [ ] **Step 3: Vizuální kontrola v mobilním zobrazení**

V Browser pane otevřít `adelka.html` přes testovací kopii (`tests/test.html` po zavření panelu s výsledky, nebo dočasnou kopii s viewport metou) a projít screenshoty:
- menu se dvěma tlačítky,
- průvodce (zamčené a odemčené řádky, text u Překližky),
- cedulka na startu cesty a HUD „Jméno · chyt/celkem“,
- převis na cestě „Převislá kytara“ (tmavý pás s hranami),
- oranžový kroužek a přikrčení před dynem na „Dobeeeer“,
- nápis „Klíčové místo“ na „Smažákova spára“,
- výsledek „Top!“ i „Neprošlo to“,
- nekonečná stěna: krátce zahrát, HUD ukazuje metry, žebříček/rekord beze změny.

Opravit, co je vizuálně rozbité, a commitnout.

- [ ] **Step 4: Commit testu**

```bash
git add tests/routes-all.test.js
git commit -m "Test: všechny cesty jdou dolezt" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Zeptat se uživatele na publikaci**

Ukázat uživateli shrnutí a nechat ho hru vyzkoušet v Browser pane. Publikovat až po jeho souhlasu.

- [ ] **Step 6: Publikace (po souhlasu)**

```bash
python tools/make_web.py
git add adelka.html docs/index.html docs/zvuky.js
git commit -m "Levely: průvodce, 8 cest, převis a dyno" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
Pak Artifact tool: publish `C:\Users\mavur\Desktop\Claude\Lachtan na lézu\adelka.html` s `files: {"zvuky.js": "C:\Users\mavur\Desktop\Claude\Lachtan na lézu\zvuky.js"}` (bez nových capabilities).
