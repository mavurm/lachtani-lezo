# Lachtaní lézo

Mobilní hra do prohlížeče: lachtanka Adélka leze nekonečnou stěnu.
Ťukej, když je jezdec ve žluté zóně, cvakej lano do karabin a nespadni třikrát.

**Hrát:** https://mavurm.github.io/lachtani-lezo/

Na iPhonu v Safari: Sdílet → Přidat na plochu, a hra se spouští přes celou obrazovku.

## Struktura

- `adelka.html` – zdroj hry (stejná stránka běží i jako artifact na claude.ai)
- `*.mp3` – kytarové zvuky a hudba na pozadí (A a D), hra je při načtení sama dočistí
- `tools/embed_sounds.py` – vloží nahrávky do `adelka.html`
- `tools/make_icons.py` – nakreslí ikonu na plochu
- `tools/make_web.py` – sestaví webovou verzi do `docs/`
- `docs/` – to, co zveřejňuje GitHub Pages
