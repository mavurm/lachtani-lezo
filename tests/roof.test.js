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
  eq(+(80 - G.pump).toFixed(1), +(A('PUMP_DRAIN') * A('ROOF').drain).toFixed(1));
});
test('mimo převis se nic nemění', () => {
  A('startRoute')(A('ROUTES')[4]);
  jumpTo(2);
  eq(A('isRoof')(3), false);
  const d = A('moveDiff')(), base = A('diff')(3).speed * (A('HOLD_MODS')[A('hold')(3).t].speed || 1);
  eq(+(d.speed / base).toFixed(2), 1);
});
