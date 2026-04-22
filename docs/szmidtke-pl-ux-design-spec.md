# Specyfikacja UX — szmidtke.pl (v2, zaakceptowana)

*Dokument referencyjny dla Claude Code. Wersja ostateczna po iteracji z prototypu v1 → v2. Zastępuje v1.*

*Decyzje projektowe przyjęte po krytyce Marcina: projekt miał być „zbyt kwadratowy / lata 90."; w v2 wprowadzono ocieplenie palety, asymetrię, teksturę papieru, drop cap, ornamenty typograficzne i literacki formularz newslettera. Finalny prototyp: `szmidtke-pl-ux-final.html`.*

---

## 0. Filozofia projektu

Strona ma wyglądać jak **dobrze złożona książka**, nie jak blog firmowy. Odbiorca (menedżer 40+, czytający świadomie) spędza z tekstem minimum 3-5 minut — cały projekt komponentów obsługuje ten akt czytania, nie akt konwersji.

**Pięć zasad:**

1. **Typografia przed grafiką.** Nagłówek większy niż każdy element wizualny. Biała przestrzeń większa niż tekst. Jeśli grafika nie dodaje treści — nie ma jej.
2. **Zero popupów, zero banerów, zero stoków.** Ani jeden element nie przeszkadza w czytaniu. Brak trackerów = brak bannera cookies (ułatwienie prawne).
3. **Czytanie > klikanie.** Feed wpisów pokazuje treść, nie miniaturki. Każdy klik przybliża do tekstu, nie od niego.
4. **Bezpieczne dla długiego czytania.** Szerokość linii ~65-70 znaków. Line-height 1.7. Font size minimum 19px. Dark mode z ciepłym kontrastem.
5. **Szybka i cicha.** Lighthouse 95+/100/100/100. Bez JavaScriptu na statycznej części. Ładowanie < 1s. Przewijanie bez zacięć.

**Sygnały temperatury (v2 — wprowadzone świadomie po „zbyt kwadratowe"):**

- Ciepła paleta (warm paper, burgundy) zamiast czystej bieli + granatu.
- Tekstura SVG noise pod całym body — daje wrażenie papieru zamiast ekranu.
- Asymetria w hero (portret wchodzi w tekst, nie siedzi nad nim).
- Ornamenty typograficzne `· · ·` zamiast linii `<hr>`.
- Drop cap na pierwszym akapicie eseju.
- Kursywa jako sygnał autorstwa (meta, podpisy, CTA).
- Soft shadows zamiast twardych borderów wokół portretów.

**Referencje estetyczne:**

- craigmod.com (literacki blog autora)
- kottke.org (reader-first, czysty)
- austinkleon.com (osobisty, ciepły)
- Pismo (dwutygodnik.com/pismo) — rozstrzygnięcia typograficzne
- mariusznonsensowy.com — polski pisarski-blogowy sznyt

---

## 1. System kolorów

**Light mode (domyślny):**

| Rola | Kolor | Hex | Użycie |
|------|-------|-----|--------|
| Background | Warm paper | `#FAF8F3` | Tło strony (+ SVG noise overlay) |
| Background alt | Cream | `#F1ECE1` | Sekcje wyróżnione (About, stopka, cover placeholders) |
| Text primary | Warm near-black | `#1F1B18` | Tekst główny |
| Text secondary | Warm gray | `#6B6560` | Daty, meta, podpisy, lead |
| Text muted | Light warm gray | `#9E9890` | Placeholder, disabled, ornament |
| **Accent** | **Burgundy** | **`#6B2E2E`** | **Linki, drop cap, akcent tekstowy** |
| Accent hover | Deep burgundy | `#4A1E1E` | Hover state |
| Border | Warm parchment | `#E5DFD2` | Linie, dividery (używane oszczędnie) |
| Success | Moss | `#4A6B3A` | Potwierdzenia formularza |
| Error | Deep rust | `#8B2E1F` | Błędy formularza |

*Uwaga v2: zrezygnowano z ink-navy `#1E3A5F` na rzecz burgundy. Navy był zbyt „profesjonalny/korporacyjny" i nie grał z tonem literackim. Burgundy ma ciepło książkowej tuszy.*

**Dark mode:**

| Rola | Kolor | Hex |
|------|-------|-----|
| Background | Warm black | `#1A1714` |
| Background alt | Softer black | `#231F1B` |
| Text primary | Warm off-white | `#EAE4DA` |
| Text secondary | Warm mid-gray | `#A09A90` |
| Text muted | Deep warm gray | `#6E685F` |
| Accent | Pale burgundy | `#C88A7A` |
| Accent hover | Lighter peach-burgundy | `#DDA598` |
| Border | Dark warm | `#332E28` |

**Zasada:** Tylko jedna para wartości akcentu. Brak kolorów kategoryjnych (red/blue/green dla tagów). Kategorie oznaczane typograficznie (kursywa, waga), nie kolorem.

---

## 2. Typografia

**Fonty:**

- **Body + headings + nawigacja + meta:** Newsreader (Google Fonts, serif, zmienna waga, warianty 300–700 + italic 400/500/600). Fallback: Source Serif Pro, Georgia.
- **UI (wyłącznie tam, gdzie font musi być neutralny — wąskie zastosowanie):** Inter. Fallback: system-ui.
- **Monospace (rzadko, do cytatów autorskich / fragmentów kodu):** IBM Plex Mono.

*Uwaga v2: w odróżnieniu od v1, nawigacja w headerze oraz meta pod tytułami używają **Newsreadera, nie Interu**. Sans-serif pojawia się wyłącznie w sytuacjach systemowych (np. skip-link), nie w warstwie literackiej.*

**Skala typograficzna (desktop / mobile):**

| Element | Desktop | Mobile | Waga | Styl |
|---------|---------|--------|------|------|
| H1 hero (strona główna) | 62-64px | 40-42px | 500 | letter-spacing -0.02em |
| H1 strona / wpis | 54px | 40px | 500 | letter-spacing -0.02em |
| H2 sekcja | 38-40px | 28px | 500 | letter-spacing -0.01em |
| H3 pod-sekcja / tytuł wpisu w feedzie | 28-32px | 26-28px | 500 | letter-spacing -0.01em |
| Lead akapit (pod H1 wpisu) | 22-23px | 20px | 400 italic | text-secondary |
| Body | 19px | 18px | 400 | line-height 1.75 |
| Meta | 15px | 15px | 400 italic | text-muted, sentence case |
| Caption / footnote | 14-15px | 14px | 400 italic | text-muted |
| Wordmark | 21px | 21px | 500 | letter-spacing -0.01em |
| Nawigacja | 17px | 17px | 400 | serif |

**Line-height:**

- Body: 1.75 (wpis), 1.7 (reszta)
- Lead: 1.5
- Headings H1 (hero): 1.15
- Headings H1 (wpis): 1.1
- H2-H3: 1.2
- Meta: 1.5

**Zasady typograficzne (v2):**

- Nagłówki: zawsze **sentence case**, nigdy title case, nigdy uppercase.
- **Meta ma być w kursywie sentence case**, nie w Inter uppercase z letter-spacingiem. Format: *„18 kwietnia 2026 — esej, sześć minut"*. Czas czytania słownie („sześć minut"), nie liczbowo.
- Tekst wpisu max-width 680px (~70 znaków na linię).
- **Drop cap** na pierwszym akapicie eseju (`.has-dropcap::first-letter`): Newsreader weight 600, 5.2em, float left, padding 6px 14px 0 0, color accent. Stosowane na pierwszym akapicie body (nie na leadzie).
- Akapity body: bez wcięcia, margin-bottom 24px.
- Cytaty blokowe: lewy border 3px accent, padding-left 28px, italic, font-size 21px, color text-secondary.
- Linki: podkreślone, accent color, underline-offset 4px, underline-thickness 1px → 2px na hover.
- Kursywa sygnalizuje „głos autora" — używana w CTA (*zapisz →*, *czytaj dalej →*, *sześć minut czytania →*), podpisach, meta, sub-nagłówkach.

---

## 3. System siatki i odstępów

**Max widths:**

- Strona (container): 1200px
- Content reading (wpis, feed): 680px
- Content szeroki (home hero wrap, about-grid, wersje-teaser): 960px

**Spacing scale (px):**
`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 72 · 80 · 96 · 120 · 160`

**Gutters (padding boczny):**

- Mobile (<768px): 24px
- Tablet/Desktop (≥768px): 48px
- Bardzo szerokie ekrany: max-width 1200px trzyma się, reszta to auto margin

**Sekcje (pion):**

- Między nagłówkami H2 a zawartością: 48-56px
- Między sekcjami: 72-96px
- Ornament jako separator: margin 72-80px góra/dół
- W stopce: 72px góra, 40px dół

**Kolumny:**

- Feed wpisów: jedna kolumna (max 680px).
- About: 2 kolumny (portret + tekst, 2:3) tylko na desktopie ≥900px.
- Wersje: 2 kolumny (okładka + tekst, 1:2) tylko na desktopie ≥768px.
- Stopka: 3 kolumny (2fr 1fr 1fr) na desktopie ≥768px.

---

## 4. Tekstura tła

Pod całym body, jako `background-image`:

```css
body {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.12 0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0.035 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
```

Na ciemnym motywie noise z jaśniejszymi tonami i mniejszym alpha (0.02). Pełne kody w `szmidtke-pl-ux-final.html`.

**Cel:** delikatne wrażenie papieru, redukcja „płaskości" cyfrowej. Tekstura niewidoczna świadomie — czujesz, że jest, ale nie widzisz jej.

---

## 5. Komponenty

### 5.1 Header

**Layout:** Pełna szerokość. Padding 28px góra/dół, gutters globalne. Brak borderu, brak cienia.

**Elementy:**

- Lewa strona: wordmark „Marcin Szmidtke" (Newsreader 500, 21px, letter-spacing -0.01em, link do `/`).
- Prawa strona: nawigacja inline — **Newsreader 17px serif**, nie Inter.
  - Piszę (→ /blog)
  - O mnie (→ /o-mnie)
  - Wersje (→ /wersje)
  - Newsletter (→ /newsletter — anchor lub podstrona)
- Dark mode toggle — **w stopce**, nie w headerze.

**Hover:** `color: text` (z `text-secondary`), bez underline.

**Mobile (<720px):** Wordmark z lewej, hamburger z prawej. Menu drawer full-screen, centered, Newsreader 26px, linki pod sobą.

**Brak:** logo graficzne, CTA w headerze, ikonka lupy, ikonki social, sticky header (pozostaje static — scrolluje się z resztą).

---

### 5.2 Home (`/`)

**Sekcja 1 — Hero (asymetryczny):**

- Container 1200px, hero-wrap 1100px.
- Portret placeholder, aspect-ratio 4/5, 380×475px na desktopie (320×400px na mobile).
- **Portret ma `margin-bottom: -120px` na desktop (-80px mobile) — świadomie wchodzi w warstwę tekstu poniżej.**
- Na desktopie ≥900px: portret po lewej z `margin-left: 40px`, tekst po prawej z `padding-left: 440px`. Ten padding tworzy asymetrię — H1 zaczyna się na wysokości środka portretu.
- Soft shadow na portrecie: `0 30px 60px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)`. Brak twardego borderu.
- H1: *„Nie mam gotowych odpowiedzi. Piszę, żeby po drodze zauważać więcej."*
- Sub (italic, text-muted): *„Marcin Szmidtke — piszę, prowadzę zespół, działam w Fundacji Pomocja."*

**Ornament separator:** `· · ·` wycentrowany, margin 72-80px góra/dół, font-size 20px, letter-spacing 1.2em (daje oddech między kropkami), color text-muted.

**Sekcja 2 — Ostatnie teksty:**

- H2: *Ostatnie teksty*
- Lista 3 wpisów, kontener `.reading` (680px).
- Każdy wpis: meta kursywą → H3 (tytuł link) → lead (text-secondary) → *„sześć minut czytania →"* (read-more italic accent).
- Separator między wpisami: 36px padding + `1px solid border-color`.
- Na końcu: *„wszystkie teksty →"* (italic accent).

**Ornament separator**

**Sekcja 3 — Newsletter (literacki):**

- Container 620px, text-align left, **nie box z buttonem**.
- H3: *List co dwa tygodnie*
- Akapit body (19px): *„Piszę list raz na dwa tygodnie. Krótszy niż teksty na stronie, bardziej z kuchni. Jeśli chcesz go dostawać — zostaw adres."*
- Akapit subtle italic (text-secondary): *„Bez automatów. Odpisać możesz zawsze — piszę sam."*
- **Formularz inline:** flex container z `border-bottom: 1px solid var(--text)`.
  - Input: transparent, serif 20px, border none, padding 14px 0, placeholder `„twój adres…"` w italic text-muted.
  - Button: *„zapisz →"* serif italic 18px, color accent, transparent bg, border none. Hover: underline.
- Mikrocopy pod: *„Wypisać się można jednym kliknięciem."* (14px italic text-muted).
- Po submit: button zmienia tekst na *„— jest, do czwartku."* (zero modali, zero redirectów).

**Ornament separator**

**Sekcja 4 — Teaser Wersji:**

- Container 960px, grid 1fr 2fr na desktop ≥768px.
- Lewa kolumna: placeholder okładki (aspect-ratio 2/3), soft shadow, bg-alt, w środku *„Wersje"* w italic serif. Brak grafiki — typografia wystarcza.
- Prawa kolumna: H3 *„Piszę powieść. Nazywa się Wersje."*, akapit opisu (text-secondary), *„więcej o książce →"* (read-more), badge statusu: *„rękopis w redakcji"* (italic, accent color, border 1px, padding 4px 14px, inline-block).

**Sekcja 5 — Stopka** (globalna, patrz 5.7).

---

### 5.3 Blog list (`/blog`)

**Sekcja 1 — Nagłówek strony:**

- Container 680px reading.
- H1: *Piszę* (54-64px, Newsreader 500).
- Subtitle (italic, 19px, text-secondary): *„O pasywności, schematach, drodze bez mety. Jeden tekst w tygodniu, czasem rzadziej."*

**Sekcja 2 — Filtr kategorii:**

- Inline, serif 16px italic, gap 24px, flex-wrap.
- Kategorie: *wszystko · esej · obserwacja · fragment · zespół*
- Aktywna: color accent + underline underline-offset 4px.
- Nieaktywna: text-secondary.
- Na mobile: scroll-x lub wrap.

**Sekcja 3 — Lista wpisów:**

- Każdy wpis = blok z hairline bottom border:
  - Meta: *„18 kwietnia 2026 — esej, sześć minut"*
  - H3 tytuł (link) — 28-32px.
  - Lead (text-secondary, 18px, max 2 linijki).
  - *„czytaj →"* (read-more italic accent).
- Padding 36px góra/dół.

**Sekcja 4 — Paginacja:**

- `← poprzednie` (disabled = text-muted) | `kolejne 10 →` (accent italic).
- Brak numerycznej paginacji. Brak infinite scroll.

---

### 5.4 Pojedynczy wpis (`/blog/[slug]`)

**Sekcja 1 — Meta:**

- *„18 kwietnia 2026 — esej, sześć minut"* (kursywa sentence case, 15px, text-muted). **Nigdy Inter uppercase letter-spaced.**

**Sekcja 2 — Tytuł:**

- H1, Newsreader 500, 54px desktop / 40px mobile, letter-spacing -0.02em, line-height 1.1.

**Sekcja 3 — Lead (opcjonalny):**

- Italic, 22-23px, text-secondary, line-height 1.5. 1-2 zdania.

**Sekcja 4 — Body (max-width 680px):**

- Pierwszy akapit body (nie lead): klasa `.has-dropcap`. Pierwsza litera w drop capie 5.2em, accent color, Newsreader 600, float left.
- Paragraphs bez wcięcia, margin-bottom 24px, 19px / line-height 1.75.
- Cytaty: border-left 3px accent, padding-left 28px, italic, 21px, text-secondary.
- Obrazy inline: pełna szerokość 680px (na desktop), margin-left/right: -40px (tzw. „oddech" przekraczający kolumnę tekstu). Caption pod obrazem: 15px italic text-muted, centered, margin-bottom 40px.
- Śródtytuły: H3 24px, 48px margin-top, 16px margin-bottom.
- Listy: punkty koła `·` zamiast bulletów. Stosowane rzadko.

**Sekcja 5 — Stopka wpisu:**

- Hairline top border, padding 48px.
- Inline opt-in (italic, text-secondary): *„Jeśli chcesz dostawać nowe teksty e-mailem — list co dwa tygodnie. Bez automatów."*
- „zobacz też" (h4 italic 16px text-muted) + 2 linki do powiązanych wpisów (serif 18px, hairline dividers).

**Brak:** komentarzy, social share, related posts w formie grid, sidebara, CTA „dołącz do newslettera" w formie boxa.

---

### 5.5 About (`/o-mnie`)

**Struktura:**

- Container 960px, grid 2fr 3fr na desktop ≥900px.
- Background: `bg-alt` (cream) — odróżnia podstronę od Home.
- Lewa kolumna: portret drugi, aspect-ratio 3/4, soft shadow, bg `--bg` (żeby był jaśniejszy niż otoczenie).
- Prawa kolumna: H2 *„O mnie"* (36-48px) + pełny tekst About (z copy-v1, `szmidtke-pl-copy-strona-v1.md`).
- Wewnątrz tekstu: `<em>Wersje</em>` italic inline (nie link w pierwszej wzmiance, link w drugiej).
- Ostatni akapit: CTA do newslettera jako inline link, nie box.

**Sekcja opcjonalna — „Co robię teraz" (v1.5):**

- H3 + lista prozą (nie bullety), krótko.
- Nie w pierwszym wdrożeniu — czeka na materiały (fotka biurka, miniaturka rysunku).

**Sekcja kontakt:**

- W ramach ostatniego akapitu About: *„Jeśli chcesz coś powiedzieć — odpisz na pierwszy list, który przyjdzie. Piszę sam."*
- Brak formularza kontaktowego. Brak strony `/kontakt`.

---

### 5.6 Wersje (`/wersje`)

**Sekcja 1 — Teaser książki:**

- Ten sam layout co teaser na Home (grid 1fr 2fr).
- Okładka placeholder (2/3) z napisem *„Wersje · M. Szmidtke"* w serif italic.
- Prawa kolumna: H3 (jedno zdanie sub-headline), akapit opisu, akapit o procesie pisania, badge *„rękopis w redakcji"*.

**Sekcja 2 — Fragment:**

- Container 680px, padding 40px 0, border-top + bottom 1px solid border-color.
- Label: *„fragment z rozdziału czwartego"* (14px italic text-muted, centered, 32px margin-bottom).
- Tekst: italic, text-secondary, 19px. 400-800 słów.
- Brak dropcapa — fragment to nie esej, ma być „wyjęty z kontekstu".

**Sekcja 3 — Ornament + opt-in specyficzny:**

- Ornament `· · ·`.
- Literacki newsletter jak na Home, ale z modyfikacją: *„Chcesz wiedzieć, kiedy ukaże się Wersje?"* zamiast *„List co dwa tygodnie"*. Body: *„Ten sam list co normalnie — raz na dwa tygodnie. W dniu, w którym książka trafi do druku, napiszę pierwszy."*

---

### 5.7 Stopka (globalny komponent)

**Layout:** Border-top hairline, padding 72px góra / 40px dół. Grid 3-kolumnowy (2fr 1fr 1fr) na desktop, 1-kolumnowy na mobile.

**Kolumna 1 — O stronie:**

- H4 italic *„O stronie"*.
- *„Pisze Marcin Szmidtke."*
- *„Strona nie używa trackerów, reklam ani cookie. Po prostu tekst."*

**Kolumna 2 — Nawigacja:**

- H4 italic *„Nawigacja"*.
- Małe litery: *piszę · o mnie · wersje · newsletter · rss* (po jednej w linii).

**Kolumna 3 — Kontakt:**

- H4 italic *„Kontakt"*.
- `kontakt@szmidtke.pl`
- `linkedin` (mały link tekstowy, bez ikony)
- Toggle dark mode (button class `theme-toggle`, italic, *„tryb ciemny ↺"* / *„tryb jasny ↺"*).

**Pod stopką (footer-bottom):**

- Hairline top, 24px padding.
- Flex space-between:
  - Lewa: *© 2026 Marcin Szmidtke*
  - Prawa: *zbudowane w Astro · źródła na GitHubie*
- 14px italic text-muted.

---

## 6. Zdjęcia — gdzie, jakie, ile

**Must-have (pierwsza wersja strony):**

| Miejsce | Typ | Wymiary zalecane | Uwagi |
|---------|-----|------------------|-------|
| Home hero | Portret główny | 800×1000 (4:5) | Profesjonalna sesja, autorski nastrój (nie korporacyjny). Zdjęcie, które może być „wolne" w komponowaniu — nie domykać pozy, nie uśmiech marketingowy. |
| About | Portret drugi | 1200×1600 (3:4) | Inne ujęcie, bardziej nieformalne. Można w ruchu, przy biurku, w dresie. |
| About inline 1 | Środowisko | 1600×900 (16:9) | Biurko, książki, notatnik — „gdzie piszę". Opcjonalnie. |
| Wersje — okładka | Placeholder typograficzny | 800×1200 (2:3) | Na start — pusta plansza z tytułem w serifie. Po odkupnie praw do okładki — zdjęcie docelowe. |

**Nice-to-have (później):**

| Miejsce | Typ | Wymiary |
|---------|-----|---------|
| Blog — obraz w wybranych wpisach | Fotografia / rysunek | 1360×900 max |
| Stopka — mini portret | Miniaturowy | 120×120 |
| OG image (social preview) | Generowany auto z tytułem | 1200×630 |

**Format i kompresja:**

- Dostarczasz: JPG/PNG oryginały.
- Strona serwuje: AVIF (primary), WebP (fallback), JPG (ostatni fallback).
- Multi-rozmiary w `srcset`: 400 / 800 / 1600px szerokości.
- LQIP (low-quality image placeholder) podczas ładowania.

**Co robić, czego nie robić:**

- **Nie:** zdjęcia stockowe. Zero.
- **Nie:** filtry Instagramowe, overexposure, dramatyczne cienie w stylu LinkedIn.
- **Tak:** sesja z fotografem znającym literacką estetykę. Budżet: 800-1500 zł.
- **Tak:** zdjęcia telefonem, jeśli autentyczne (biurko w świetle porannym > stok).
- **Ton portretów:** światło miękkie, background neutralny, spojrzenie w bok / w dół, nie w kamerę na wprost.

---

## 7. Responsywność

**Breakpointy:**

- Small: <640px (telefon)
- Medium: 640-1024px (tablet)
- Large: >1024px (desktop)
- Kluczowe zachowania zmieniają się przy: 720px (hamburger), 768px (container padding, sekcje), 900px (hero asymetria, about grid).

**Reguły:**

- Mobile-first w CSS.
- Typografia skaluje się wartościami z tabeli w 2.
- Układy asymetryczne w desktop → 1-kolumnowe w mobile (portret na górze, tekst pod).
- Nawigacja → hamburger + full-screen menu w mobile.
- Gutters 24px mobile → 48px desktop.
- Zdjęcia `srcset` + `sizes` zawsze.

**Test na:**

- iPhone SE (375px) — minimum
- iPhone 14 (393px)
- iPad (768px)
- MacBook (1440px)
- 4K (2560px+) — max-width 1200px trzyma się

---

## 8. Dostępność (WCAG 2.1 AA)

- Contrast ratio body (`#1F1B18` na `#FAF8F3`): ~14:1 (AAA).
- Meta (text-muted `#9E9890` na `#FAF8F3`): ~3.4:1 — **wymaga korekty** jeśli używane na tekst poniżej 18px. Aktualnie używane na 15px italic, trzeba albo pogłębić text-muted do `#8A857E` (4.5:1), albo akceptować jako element dekoracyjny, nie informacyjny. **Decyzja: pogłębiamy text-muted na stronie produkcyjnej.**
- Accent (burgundy `#6B2E2E` na `#FAF8F3`): ~9:1 — pass AAA.
- Wszystkie obrazy z `alt` text. Dekoracyjne: `alt=""` + `aria-hidden="true"`.
- Keyboard navigable: tab order logiczny. Focus states `outline: 2px solid var(--accent); outline-offset: 3px`.
- Skip-to-content link na górze (ukryty visually, widoczny na focus).
- Formularze: labels widoczne lub `sr-only` z poprawnym `for`/`id`. `aria-required`, error states z `aria-live="polite"`.
- Heading hierarchy: H1 unikalny per strona. H2, H3 kolejno.
- Linki: zawsze w kontekście zdania. Zero *„kliknij tutaj"*.
- `prefers-reduced-motion`: wszystkie transitions disabled, `scroll-behavior: auto`.
- Ornament `· · ·` ma `aria-hidden="true"` — screen reader nie czyta dekoracji.

---

## 9. Animacje i interakcje

**Stosowane:**

- Hover na linkach: underline-thickness 1 → 2px w 150ms.
- Newsletter form submit: subtelna zmiana tekstu buttona (*„zapisz →"* → *„— jest, do czwartku."*), bez confetti.
- Dark mode toggle: 300ms transition na kolorach.
- Page fade-in (200ms) na load — tylko jeśli nie ma `prefers-reduced-motion`.

**Niestosowane (celowo):**

- Parallax.
- Scroll-triggered animacje.
- Hover effects z transformami (scale, rotate, translate).
- Confetti, sparkles, gradient animations.
- Autoplay czegokolwiek.
- Smooth scroll dla wewnętrznych linków poza domyślnym `scroll-behavior: smooth`.

---

## 10. JavaScript — minimum

**Wymagane JS:**

- Newsletter form (fetch do Substack/Buttondown API albo mailto fallback). Po sukcesie — zmiana tekstu buttona inline, bez modali.
- Dark mode toggle (`localStorage` + `data-theme` attribute na `<html>`).
- Menu mobile (open/close drawer).

**Nie ma:**

- Google Analytics (jeśli analytics w ogóle — to Plausible self-hosted).
- Zewnętrzne widgety (Twitter, Medium, Disqus).
- Chat bubble.
- Pop-upy wyjściowe.
- Sticky header z animacją pokazywania/ukrywania.

**Budżet JS na stronę:** <30kb bundled.

---

## 11. SEO i meta

**Per strona:**

- `<title>`: *„Tytuł wpisu — Marcin Szmidtke"*
- `<meta description>`: lead wpisu, 150-160 znaków.
- Open Graph: title, description, image (auto-generowana z tytułem na `#FAF8F3` + Newsreader + burgundy accent).
- Twitter card: `summary_large_image`.
- Canonical URL.
- JSON-LD `Article` / `BlogPosting` dla wpisów.
- JSON-LD `Person` dla Home/About.

**Globalne:**

- `/rss.xml` — pełny feed, ostatnie 20 wpisów.
- `/sitemap.xml` — auto-generowana.
- `/robots.txt` — pozwala wszystko, wskazuje sitemap.

**OG image (auto-generowany przez Astro):**

- Tło `#FAF8F3`, subtelna tekstura noise.
- Tytuł wpisu Newsreader 500, 72px, text `#1F1B18`.
- Stopka: *„Marcin Szmidtke · szmidtke.pl"* Newsreader italic 24px, text-muted.

---

## 12. Struktura URL

```
/                          — Home
/blog                      — Lista wpisów
/blog/[slug]               — Pojedynczy wpis
/blog/kategoria/[nazwa]    — Filtr kategorii (opcjonalnie, v1.5)
/o-mnie                    — About
/wersje                    — Strona powieści
/newsletter                — Landing newslettera (anchor z Home w v1)
/rss.xml                   — Feed RSS
/sitemap.xml               — Sitemap
```

Slugi wpisów: polskie bez polskich znaków (ą → a, ż → z, ś → s, ł → l, etc.), małe litery, myślniki:
`pasywnosc-ktora-wyglada-jak-odpoczynek`

---

## 13. Dark mode — szczegóły

**Aktywacja:**

- Respekt `prefers-color-scheme: dark` jako default dla nowych użytkowników.
- Toggle w stopce z `localStorage` override — ustawiony `data-theme` zwycięża nad media query.

**Paleta:** patrz 1 (System kolorów / dark mode).

**Zasady:**

- Body text `#EAE4DA` na `#1A1714` — ciepły kontrast, nie kliniczny.
- Zdjęcia: delikatne przyciemnienie 95% brightness (`filter: brightness(0.95)` na `<img>` — opcjonalne, do przetestowania z prawdziwymi zdjęciami).
- Border i line subtelniejsze (`#332E28`).
- Accent: pale burgundy `#C88A7A` zamiast ciemnego `#6B2E2E`.
- Tekstura noise: odwrócona (jasne plamki na ciemnym), mniejsze alpha (0.02).
- Dark mode nie jest „na odwrót" — każdy kolor dobrany osobno.

---

## 14. Checklist „przed go-live"

- [ ] Home: hero asymetryczny + 3 wpisy + newsletter literacki + teaser Wersji + stopka
- [ ] /o-mnie: pełny tekst z copy-v1 + 2 zdjęcia + kontakt inline
- [ ] /wersje: teaser + fragment + opt-in specyficzny
- [ ] /blog: lista 10+ wpisów + filtr kategorii + paginacja
- [ ] /blog/[slug]: pojedynczy wpis, drop cap, cytat blokowy, inline image, stopka wpisu
- [ ] Newsletter: fetch do Substack/Buttondown, błędy, potwierdzenia (inline button change)
- [ ] Dark mode: toggle + respekt prefers + localStorage
- [ ] Mobile: hamburger menu drawer, gutters, typografia skalująca
- [ ] Accessibility: keyboard nav, focus states, skip-link, alt texts, aria-hidden na ornamentach
- [ ] SEO: meta, OG, twitter, canonical, RSS, sitemap, robots.txt, JSON-LD
- [ ] Performance: Lighthouse 95+ we wszystkich kategoriach
- [ ] Fonty: preconnect + font-display: swap, subset Latin Extended (polskie znaki)
- [ ] 404: literacka, krótka, z linkiem do Home (*„Nie ma tego, czego szukasz. Jest to, co mam."*)
- [ ] Zdjęcia: portretowe + supplemental + dla Wersji, wszystkie w 3 rozmiarach AVIF/WebP/JPG
- [ ] Tekstura noise: SVG inline w CSS (nie plik PNG), weryfikacja w dark i light mode
- [ ] Contrast check: text-muted pogłębiony do 4.5:1 dla tekstu funkcjonalnego
- [ ] Motion: `prefers-reduced-motion` disable wszystkie transitions

---

## 15. Stack techniczny

**Frontend:** Astro (static site generation) + MDX dla wpisów + Tailwind (tokeny w config przepisane z CSS custom properties powyżej) LUB czysty CSS z CSS custom properties — decyzja przy starcie Claude Code.

**Backend/newsletter:** Buttondown API (pierwszy wybór — prostsze, polska obsługa) lub Substack embed (drugi wybór, jeśli Buttondown nie działa w Polsce z VAT-em).

**Hosting:** self-hosted na VPS Marcina (nginx + Docker Compose już działają), build deploy przez `rsync` / git hook.

**Analytics:** Plausible self-hosted lub brak analityki (decyzja po v1).

**Domena:** szmidtke.pl (obecna, do podmiany w DNS po gotowości).

---

## 16. Co nie wchodzi w v1

Zapisane, żeby nie tracić:

- Komentarze — wyłączone na zawsze.
- Wyszukiwarka (v1.5, dopiero gdy jest ponad 30 wpisów).
- Archiwum per rok / per miesiąc (v1.5, dopiero gdy jest ponad 50 wpisów).
- Strona z rysunkami (faza 2, po upadłości).
- Autorskie ilustracje nagłówkowe dla wpisów (faza 2).
- Podcast (faza 2).
- Mailing automation sekwencyjny (faza 2).
- Sekcja „Co robię teraz" w About (wchodzi po materiałach).
- PewnyPlan jako osobna wzmianka (nie wchodzi do fazy 1 — linki osobno, bez krzyżowania brandu).

---

## 17. Decyzje v1 → v2 (dla pamięci)

Dla przyszłego siebie i dla Claude Code, żeby nie wracać do dyskusji:

| Decyzja v1 | Zmiana w v2 | Powód |
|------------|-------------|-------|
| Accent ink-navy `#1E3A5F` | Burgundy `#6B2E2E` | Navy za bardzo korporacyjne, nie gra z literackim tonem |
| Background `#FAFAF7` czyste | `#FAF8F3` + SVG noise | „Zbyt kwadratowe", brakowało tekstury papieru |
| Meta w Inter uppercase letter-spaced | Newsreader italic sentence case | Uppercase daje „90's blog", kursywa daje „książka" |
| Nawigacja w Inter 14-15px | Newsreader 17px serif | Sans-serif kłócił się z literackim layoutem |
| Hero: portret nad H1 centered | Portret asymetryczny, wchodzi w tekst margin-bottom -120px | Symetria była „kwadratowa", asymetria daje ruch |
| `<hr>` między sekcjami | Ornament `· · ·` centered | Linie = blog techniczny, ornament = książka |
| Newsletter w box z buttonem | Inline text form z underline input | Box wyglądał jak Mailchimp embed, inline jest literackie |
| Portrety z twardym borderem | Soft shadow (30px 60px rgba 0.08) | Twardy border = „90's polaroid", cień = „wydrukowane zdjęcie" |
| Feed wpisów bez akcentu typograficznego | Drop cap na pierwszym akapicie wpisu w view pojedynczym | Drop cap jest sygnaturą literacką bez dodatku grafiki |

---

*Dokument projektowy, v2 ostateczny. Następna iteracja — już w kodzie Astro. Claude Code bierze `szmidtke-pl-ux-final.html` jako wzorzec wizualny i tę specyfikację jako reguły.*
