# Zdjęcia i assety

Tutaj wrzucaj oryginalne zdjęcia. `astro:assets` zoptymalizuje je automatycznie
(AVIF + WebP + JPG, srcset 400/800/1600).

## Co i gdzie

| Plik | Użycie | Wymiary zalecane | Format |
|------|--------|------------------|--------|
| `portret-home.jpg` | Hero na stronie głównej | 800×1000 (4:5) | JPG lub PNG, min 1600px |
| `portret-about.jpg` | Drugi portret na /o-mnie | 1200×1600 (3:4) | JPG lub PNG, min 2400px |
| `okladka-nie-ja.png` | Okładka powieści *Nie ja* | 800×1200 (2:3) | PNG |

## Gdy wrzucisz zdjęcie

1. Nazwij plik dokładnie jak w tabeli (np. `portret-home.jpg`).
2. Zatwierdź commitem: `git add src/assets/portret-home.jpg && git commit -m "assets: dodaj portret home"`.
3. `SmartImage.astro` wykryje plik i podmieni SVG placeholder na prawdziwe zdjęcie.
4. Jeśli pliku nie ma → placeholder zostaje (bezpieczny fallback).

## Docelowe zdjęcia

Spec §6: sesja z fotografem znającym literacką estetykę,
światło miękkie, neutralne tło, spojrzenie w bok/w dół (nie w kamerę).
Budżet: 800–1500 zł. Zero stoków, zero filtrów Instagramowych.
