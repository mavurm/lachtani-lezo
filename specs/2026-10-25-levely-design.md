# Levely (cesty) – návrh

Datum: 2026-10-25
Stav: odsouhlaseno po částech v chatu, čeká na review tohoto souboru

## Cíl

Vedle nekonečné stěny přidat ručně postavené cesty (levely) s pevnou obtížností,
hodnocením hvězdičkami a postupným odemykáním. Ručně stavěné stěny umožní klíčová
místa, gradaci a dva nové pohyby: převis a dyno.

První verze (tento návrh): 2 sektory, 8 cest, převis, dyno, hvězdičky, odemykání.
Další sektory (Beton, Pískovec) a pohyby přijdou později a nejsou součástí tohoto návrhu.

## Rozhodnutí

| Otázka | Rozhodnutí |
|---|---|
| Uložení cest | Data přímo v `adelka.html` (jeden soubor, funguje na claude.ai i GitHub Pages) |
| 3. pád na cestě | Cesta končí, znovu od začátku |
| Mechaniky na cestách | Pumpa, vylepšení, odpočinek, Den lezení, překážky i tajná úleva – vše na pevných místech podle zápisu cesty |
| Dyno | Jen perfektní trefa (na liště jen zelený střed) |
| Výběr cest | Seznam jako průvodce (karty sektorů, řádky cest) |
| Nekonečná stěna | Zůstává beze změny jako druhý režim, včetně rekordu a žebříčku |

## 1. Obrazovky a průběh

- **Menu:** dvě tlačítka – „Cesty“ (otevře průvodce) a „Nekonečná stěna“ (dnešní hra).
- **Průvodce:** svisle karty sektorů.
  - Karta sektoru: název, krátký popis, součet hvězd (např. 7/12).
  - Řádek cesty: barevný štítek (barva chytů cesty), jméno, stupeň, 0–3 hvězdičky; zamčená cesta má zámek a text, co ji odemkne.
  - Zamčený sektor: „Odemkne se za 6 ★“.
  - Tlačítko „Zpět“ do menu.
- **Start cesty:** na chvíli cedulka s jménem a stupněm cesty.
- **HUD na cestě:** místo „stupeň · metry“ ukazuje „Jméno · chyt/celkem“ (např. „Smažákova spára · 7/24“).
- **Top:** na posledním chytu cvaknutí slaňáku, Mára „Kedlubna!“, zvuk, spuštění dolů, pak výsledková obrazovka.
- **Výsledek:** hvězdičky, počet pádů, počet perfektů; tlačítka „Další cesta“ (pokud je odemčená), „Zkusit znovu“, „Průvodce“.
- **3. pád:** stejné jako dnes (vis, „Doluuuu!“, spuštění), pak obrazovka „Neprošlo to“ s „Zkusit znovu“ a „Průvodce“.
- **Ukládání:** hvězdičky a odemčení v `localStorage` (v try/catch jako rekord). Žádný sdílený žebříček pro cesty.

## 2. Obsah

**Obtížnost:** každý stupeň má pevnou „ekvivalentní výšku“ pro stávající funkci `diff()`.
V rámci cesty se nemění podle výšky; tajná úleva po odpočinku platí.

| Stupeň | Ekvivalent `diff(i)` |
|---|---|
| 4a | 0 |
| 4c | 6 |
| 5a | 10 |
| 5b | 15 |
| 5c | 20 |
| 6a | 26 |
| 6a+ | 30 |
| 6b | 36 |

**Sektor 1: Hala** (první cesta odemčená, další se odemyká dolezením předchozí)

| # | Cesta | Stupeň | Chytů | Obsah |
|---|---|---|---|---|
| 1 | Rozlez | 4a | 15 | samá madla, 2 jištění |
| 2 | Mňam madla | 4c | 18 | první lišty, magnézium a smažák |
| 3 | Kedlubna | 5a | 20 | dírky a štípačky, odpočinek v půlce |
| 4 | Smažákova spára | 5b | 24 | klíčové místo z oblin, před ním pivo |

**Sektor 2: Překližka** (odemkne se za 6 ★ z Haly; uvnitř opět postupně)

| # | Cesta | Stupeň | Chytů | Obsah |
|---|---|---|---|---|
| 5 | Převislá kytara | 5c | 22 | první krátký převis |
| 6 | Dobeeeer | 6a | 26 | první dyno, před ním magnézium |
| 7 | Já říkal den lezení | 6a+ | 28 | jistý Den lezení, magnézium do očí v klíčovém místě |
| 8 | Pumpovací stroj | 6b | 32 | dlouhý převis, dyno v klíčovém místě pod topem |

**Hvězdičky:** ★ dolezeno; ★★ nejvýš 1 pád; ★★★ bez pádu a aspoň třetina chytů perfektně.

**Zápis cesty (formát):**

```js
{
  id: 'smazakova-spara', name: 'Smažákova spára', grade: '5b', color: '#ff7a2f', sector: 'hala',
  holds: [
    // x: 0–1 přes šířku stěny, t: typ chytu, volitelně item / bolt / rest / day / eye / wind / dyno / crux / roof
    { x: 0.5, t: 'jug' },
    { x: 0.42, t: 'crimp', bolt: true },
    { x: 0.58, t: 'jug', item: 'beer' },
    { x: 0.5, t: 'sloper', crux: true },
    // …
  ]
}
```

Vlastnosti chytu mají přednost před náhodným generováním: kde je `bolt`, je jištění;
kde je `item`, visí vylepšení; `rest` spouští odpočinek; `day` Den lezení; `eye` / `wind`
překážku; `dyno` skok na tento chyt; `roof` označuje převislý úsek; `crux` klíčové místo.
Bez těchto značek se na cestě nic náhodného nespouští.

## 3. Nové pohyby

**Převis** (chyty se značkou `roof`):
- Vzhled: tmavší, stínovaný úsek stěny s výraznou spodní a horní hranou; Adélka víc odkloněná, nohy se houpou.
- Hraní: jezdec +20 % rychlosti, cena chytu za sílu ×1,5, visení ubírá sílu 2× rychleji.
- Nad horní hranou hláška Adélky (např. „Uf!“).

**Dyno** (chyt se značkou `dyno`):
- Cílový chyt je o dva chyty výš, mezi nimi mezera bez chytu; kroužek dalšího chytu je oranžový; Adélka se přikrčí.
- Lišta ukazuje jen zelený střed (perfektní zónu), žlutá chybí.
- Trefa: skok s krátkým letem, přeskočí 2 chyty, body za perfekt, Mára „Hezky!“.
- Mimo zelenou: pád.
- Cena za sílu jako lišta (díky perfektu efektivně polovina).

**Klíčové místo** (`crux`): nad lištou nápis „Klíčové místo“, hraje se normálně.

## 4. Beze změny

Nekonečná stěna (včetně rekordu a žebříčku na claude.ai), postavy, zvuky, hudba,
publikace na claude.ai i GitHub Pages.

## Ověření

- Automatická kontrola dat každé cesty: počet chytů, x v rozsahu, existující typy, jištění, dyno nikdy na prvním chytu ani hned po jiném dynu.
- Projetí každé cesty nanečisto bez pádu (3 hvězdy) a se 3 pády („Neprošlo to“).
- Odemykání: dolezení odemkne další cestu, 6 ★ odemkne Překližku; uložení přežije obnovení stránky.
- Převis: rychlost, cena síly, rychlejší úbytek při visení.
- Dyno: jen zelená zóna, přeskočení 2 chytů, pád mimo zelenou.
- Nekonečná stěna se chová stejně jako před změnou.
- Kontrola všech nových obrazovek v mobilním zobrazení před publikací.

## Rizika

- Vyváženost obtížností je odhad; po prvním hraní ladit hlavně dyno a převis.
- Největší změna hry zatím; stavět po krocích (data + průvodce → převis a dyno → hvězdičky a odemykání), každý krok zvlášť vyzkoušet.
