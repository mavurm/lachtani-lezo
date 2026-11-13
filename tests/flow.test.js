test('start cesty postaví stěnu podle zápisu', () => {
  const R = A('ROUTES'), G = A('G');
  A('startRoute')(R[0]);
  eq(G.route.id, 'rozlez');
  eq(A('holds').length, 15);
  eq(A('bolts'), [0, 5, 10]);
  eq(G.items.size, 0);
  ok(A('hold')(40).none, 'nad topem žádné chyty');
  eq(A('diff')(12).speed, 0.5, 'obtížnost 4a je pevná');
  eq(A('$')('grade').textContent, '0/14 · Rozlez');
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
  ok([G.nextDay, G.nextEyeAt, G.nextGustAt, G.nextItemAt].every(v => v === Infinity), 'nic náhodného se neplánuje');
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
  A('ensureBolts')(30);
  ok(A('bolts').length > 2, 'jištění se zase generují');
  ok([G.nextDay, G.nextEyeAt, G.nextItemAt].every(Number.isFinite), 'náhodné události se zase plánují');
});
test('cesta má po celé výšce stěnu svého sektoru', () => {
  const G = A('G'), cv = A('cv'), cx = cv.getContext('2d'), dpr = cv.width / innerWidth;
  const px = () => Array.from(cx.getImageData(Math.round(30 * dpr), Math.round(innerHeight * 0.3 * dpr), 1, 1).data).slice(0, 3);
  A('startRoute')(A('ROUTES')[4]);           // Překližka: plywood
  G.banner = null;
  const look = i => { jumpTo(i); G.camY = G.sy; A('draw')(); return px(); };
  const low = look(2), high = look(21);
  ok(low[0] > low[2] && high[0] > high[2], 'dřevo je teplé (víc červené než modré) dole i nahoře: ' + low + ' / ' + high);
});
test('na cestě se rekord nezobrazuje, na nekonečné stěně ano', () => {
  A('startRoute')(A('ROUTES')[3]);
  eq(A('$')('bestHud').hidden, true);
  A('startGame')();
  eq(A('$')('bestHud').hidden, false);
});
