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
