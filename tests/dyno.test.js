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
test('počítadlo tahů nepočítá mezeru pod dynem', () => {
  A('startRoute')(A('ROUTES')[5]);
  jumpTo(12); A('updHUD')();
  eq(A('$')('grade').textContent, '11/24 · Dobeeeer');
});
