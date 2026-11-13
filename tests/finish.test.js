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
