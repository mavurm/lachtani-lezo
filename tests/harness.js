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
    // every test starts from a clean game, whatever the previous one left behind
    try { A('reset')(); } catch (e) {}
  }
  window.TEST_RESULT = res;
  window.TEST_DONE = true;
  const pre = document.createElement('pre');
  pre.style.cssText = 'position:fixed;inset:0;z-index:99;margin:0;padding:12px;background:#fff;color:#000;font:12px monospace;overflow:auto';
  pre.textContent = res.join('\n');
  document.body.appendChild(pre);
}
window.addEventListener('load', () => setTimeout(runTests, 300));
