# Builds tests/test.html: the game with an eval hook for the tests, the tiny harness and every tests/*.test.js.
import glob, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
game = io.open(os.path.join(ROOT, 'adelka.html'), encoding='utf-8').read()
marker = '/* ---------- boot ---------- */'
assert game.count(marker) == 1, 'boot marker missing'
game = game.replace(marker, 'window.__adelka = n => eval(n);\n' + marker)
# The browser pane opens local files as data: pages, where neighbouring files don't load and
# localStorage is blocked. So the recordings are inlined, and a stand-in storage kicks in only
# when the real one is unavailable.
sounds = io.open(os.path.join(ROOT, 'zvuky.js'), encoding='utf-8').read()
game = game.replace('<script src="zvuky.js"></script>', '<script>\n' + sounds + '\n</script>')
STORAGE_SHIM = """<script>
try { window.localStorage.length; } catch (e) {
  const mem = new Map();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k), clear: () => mem.clear(),
    key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; } } });
}
</script>"""
parts = [io.open(os.path.join(ROOT, 'tests', 'harness.js'), encoding='utf-8').read()]
for f in sorted(glob.glob(os.path.join(ROOT, 'tests', '*.test.js'))):
    parts.append(io.open(f, encoding='utf-8').read())
html = ('<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + STORAGE_SHIM + '</head>'
        '<body style="margin:0">' + game + '<script>\n' + '\n'.join(parts) + '\n</script></body></html>')
io.open(os.path.join(ROOT, 'tests', 'test.html'), 'w', encoding='utf-8', newline='\n').write(html)
print('tests/test.html built with', len(parts) - 1, 'test files')
