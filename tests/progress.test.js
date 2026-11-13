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
