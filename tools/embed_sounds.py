# Embeds the guitar recordings into adelka.html as one <script> with base64 strings.
# Re-running replaces the previous embed, so new recordings can simply be dropped in.
import base64, io, os, sys

d = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
page = os.path.join(d, 'adelka.html')
FILES = {
    'grabA': 'Chyt A.mp3',
    'grabD': 'Chyt D.mp3',
    'perfect': 'Perfektní chyt.mp3',
    'miss': 'Minutí.mp3',
    'clip': 'Cvak lana.mp3',
    'fall': 'Pád.mp3',
    'rest': 'Odpočinek.mp3',
    'day': 'den lezení.mp3',
    'start': 'Start.mp3',
    'lower': 'Spusteni na zem.mp3',
    'over': 'konec hry.mp3',
    'music': 'hudba na pozadi.mp3',
}
parts = []
for key, name in FILES.items():
    path = os.path.join(d, name)
    if not os.path.exists(path):
        print('missing', name)
        continue
    parts.append("%s:'%s'" % (key, base64.b64encode(open(path, 'rb').read()).decode()))
block = '<script id="adelka-sounds">window.ADELKA_SND={' + ','.join(parts) + '};</script>\n'

s = io.open(page, encoding='utf-8').read()
start = s.find('<script id="adelka-sounds">')
if start >= 0:
    end = s.index('</script>\n', start) + len('</script>\n')
    s = s[:start] + block + s[end:]
else:
    anchor = "<script>\n(() => {"
    assert s.count(anchor) == 1
    s = s.replace(anchor, block + anchor)
io.open(page, 'w', encoding='utf-8').write(s)
print('embedded', len(parts), 'sounds,', len(block) // 1024, 'KB')
