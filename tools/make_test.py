# Builds tests/test.html: the game with an eval hook for the tests, the tiny harness and every tests/*.test.js.
import glob, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
game = io.open(os.path.join(ROOT, 'adelka.html'), encoding='utf-8').read()
marker = '/* ---------- boot ---------- */'
assert game.count(marker) == 1, 'boot marker missing'
game = game.replace(marker, 'window.__adelka = n => eval(n);\n' + marker)
# the test page lives in tests/, the recordings next to the game
game = game.replace('<script src="zvuky.js"></script>', '<script src="../zvuky.js"></script>')
parts = [io.open(os.path.join(ROOT, 'tests', 'harness.js'), encoding='utf-8').read()]
for f in sorted(glob.glob(os.path.join(ROOT, 'tests', '*.test.js'))):
    parts.append(io.open(f, encoding='utf-8').read())
html = ('<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head>'
        '<body style="margin:0">' + game + '<script>\n' + '\n'.join(parts) + '\n</script></body></html>')
io.open(os.path.join(ROOT, 'tests', 'test.html'), 'w', encoding='utf-8', newline='\n').write(html)
print('tests/test.html built with', len(parts) - 1, 'test files')
