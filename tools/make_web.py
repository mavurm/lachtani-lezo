# Builds the standalone web version (GitHub Pages) from adelka.html into docs/.
# The claude.ai artifact adds the page skeleton itself; here it is written out in full,
# plus the "Add to Home Screen" bits for iPhone and Android.
import io, json, os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs')
os.makedirs(OUT, exist_ok=True)

body = io.open(os.path.join(ROOT, 'adelka.html'), encoding='utf-8').read()
# the web build carries the game's public name in the browser tab
body = body.replace('<title>Lachtanka Adélka na lézu</title>', '<title>Lachtaní lézo</title>', 1)

head = """<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="description" content="Lachtanka Adélka leze nekonečnou stěnu. Pomoz jí vylézt, aby mohla na smažák a pivo.">
<meta name="theme-color" content="#22384d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Lachtaní lézo">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<script>window.ADELKA_STANDALONE = true;</script>
</head>
<body>
"""
io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8', newline='\n').write(head + body + '\n</body>\n</html>\n')

manifest = {
    'name': 'Lachtaní lézo',
    'short_name': 'Lachtaní lézo',
    'lang': 'cs',
    'start_url': './',
    'scope': './',
    'display': 'standalone',
    'orientation': 'portrait',
    'background_color': '#22384d',
    'theme_color': '#22384d',
    'icons': [
        {'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'},
        {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'},
    ],
}
io.open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8', newline='\n').write(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
# GitHub Pages: serve files as they are
io.open(os.path.join(OUT, '.nojekyll'), 'w').write('')
print('docs/ built:', sorted(os.listdir(OUT)))
