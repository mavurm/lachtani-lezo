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
