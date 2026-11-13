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
