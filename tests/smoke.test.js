test('hra se načte v menu', () => {
  eq(A('G').mode, 'menu');
});
test('nekonečná stěna generuje chyty s typem', () => {
  ok(A('hold')(30).t, 'chyt 30 má typ');
  A('ensureBolts')(20);
  ok(A('isBolt')(A('bolts').find(b => b > 0)), 'existuje jištění');
});
