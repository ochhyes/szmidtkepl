# Plan iteracji dla Claude Code — szmidtke.pl

*Dokument PM: rozbicie budowy portalu na iteracje mieszczące się w limicie jednej odpowiedzi Claude Code. Każda iteracja to osobna sesja / osobny prompt. Sesje są sekwencyjne — iteracja N zakłada, że N-1 jest gotowa i zmergowana.*

**Wejście dla Claude Code (zawsze, każda iteracja):**
- `szmidtke-pl-ux-design-spec.md` — źródło prawdy dla reguł (kolor, typografia, komponenty).
- `szmidtke-pl-ux-final.html` — wzorzec wizualny. CSS z tego pliku jest referencją 1:1; Claude Code ma go przenieść do Astro, nie wymyślać od nowa.

**Decyzje PM (przyjęte za Marcina, żeby Claude Code nie musiał ich rozstrzygać):**
- Stack: **Astro 5 + MDX + czysty CSS z custom properties** (bez Tailwinda — prototyp już tak jest napisany, nie powielamy narzędzi).
- TypeScript: **tak** (Astro domyślnie).
- Menedżer paczek: **pnpm** (szybszy, mniejsze `node_modules`; jeśli Marcin nie ma — fallback npm).
- Repo: git od iteracji 0, jedno repo z kodem + treścią w MDX. **Remote GitHub:** `https://github.com/ochhyes/szmidtkepl` (origin).
- Newsletter: **Buttondown** jako pierwszy wybór, `BUTTONDOWN_API_KEY` w `.env`. Fallback: `mailto:`.
- Hosting: kontener Docker + nginx, deploy przez git push na VPS (bare repo + post-receive hook). GitHub = źródło prawdy i backup.

**Zasada prowadzenia iteracji:**
1. Każda iteracja ma dostać **cały ten dokument** + dwa pliki źródłowe wejściowe, ale prompt kieruje tylko na jedną iterację.
2. Po każdej iteracji: krótki raport — co zrobione, co dalej, ewentualne blokery.
3. Commit git na końcu każdej iteracji — jasny komunikat.
4. Przed iteracją N+1 — szybki review zmian przez Marcina.

---

## Iteracja 0 — Setup projektu (≈150-300 linii)

**Cel:** Działający szkielet Astro z konfiguracją, gotowy do wrzucenia treści.

**Prompt do Claude Code:**
> Załóż projekt Astro dla szmidtke.pl wg `iteracje-claude-code.md` iteracja 0. Użyj Node 20+, pnpm, TypeScript strict. Zainstaluj integracje: `@astrojs/mdx`, `@astrojs/sitemap`, `astro-image` (lub wbudowane `astro:assets`). Skonfiguruj `astro.config.mjs` z `site: "https://szmidtke.pl"`. Stwórz strukturę folderów: `src/layouts`, `src/components`, `src/pages`, `src/content/blog`, `src/styles`, `public`. Dodaj `.gitignore`, `.env.example`, `README.md` z instrukcją `pnpm dev` / `pnpm build`. Inicjalizuj git (`git init -b main`), pierwszy commit „iteration 0: project scaffold". Repo na GitHubie jest puste — dodaj remote i pushnij bez ceregieli: `git remote add origin https://github.com/ochhyes/szmidtkepl.git && git push -u origin main`.

**Do zrobienia:**
- `package.json` z zależnościami i skryptami (`dev`, `build`, `preview`, `astro check`).
- `astro.config.mjs` z integracjami MDX, sitemap, konfiguracją `site`.
- `tsconfig.json` strict.
- Struktura katalogów (jak wyżej).
- Pusta strona `src/pages/index.astro` mówiąca „w budowie" — potwierdzenie że build działa.
- `.gitignore` (node_modules, dist, .env, .DS_Store).
- `.env.example` ze zmiennymi: `BUTTONDOWN_API_KEY=`, `PUBLIC_SITE_URL=https://szmidtke.pl`.
- `README.md` — jak uruchomić lokalnie, jak zbudować, link do repo `https://github.com/ochhyes/szmidtkepl`.
- `git init` + pierwszy commit + remote `origin = https://github.com/ochhyes/szmidtkepl.git` + push na `main`.

**Gotowe kiedy:** `pnpm install && pnpm build` kończy się bez błędów, `pnpm dev` startuje na porcie 4321 i pokazuje stronę „w budowie". Kod widoczny na https://github.com/ochhyes/szmidtkepl.

**Poza zakresem:** style, layout, zdjęcia, treść, Docker.

---

## Iteracja 1 — Design system + layout shell (≈400-600 linii)

**Cel:** Wszystkie strony mają spójny header/stopkę, tokeny kolorów, dark mode, typografię. Gotowa baza pod wszystkie podstrony.

**Prompt do Claude Code:**
> Iteracja 1 wg `iteracje-claude-code.md`. Przenieś globalny CSS z `szmidtke-pl-ux-final.html` (tokeny, reset, tekstura noise, bazowa typografia, link styles, focus, skip-link) do `src/styles/global.css`. Stwórz `src/layouts/BaseLayout.astro` z pełnym `<head>` (fonty Google, meta, OG, favicon placeholder), skip-linkiem, headerem (wordmark + nav), slot na content, stopką. Nav: desktop inline + mobile hamburger drawer (vanilla JS, <30 linii). Dark mode toggle w stopce — `localStorage` + `data-theme` na `<html>`, respekt `prefers-color-scheme`, inline script przed hydration żeby uniknąć flash. Komponent `Ornament.astro` (`· · ·` z `aria-hidden`). Zastosuj layout na `index.astro`. `prefers-reduced-motion` wyłącza transitions.

**Do zrobienia:**
- `src/styles/global.css` — tokeny (`:root` + `[data-theme="dark"]`), reset, tekstura noise w body, typografia bazowa, `.container`, `.reading`, `.wide`, `.meta`, `.skip-link`, linki, focus, `img`, `prefers-reduced-motion`.
- `src/layouts/BaseLayout.astro` — props: `title`, `description`, `ogImage?`, `canonical?`. Preconnect + fonty Newsreader (wagi 400/500/600 + italic 400/500/600) z `display=swap`.
- `src/components/SiteHeader.astro` — wordmark + `nav.primary` + hamburger (button z `aria-expanded`).
- `src/components/SiteFooter.astro` — 3-kolumnowy grid, dark-mode toggle, footer-bottom.
- `src/components/Ornament.astro`.
- `src/scripts/menu.js` (lub inline w komponencie) — drawer open/close + focus trap minimum.
- `src/scripts/theme.js` — inline script w `<head>` ustawiający `data-theme` przed paintem.
- Podmiana `src/pages/index.astro` — korzysta z `BaseLayout`, placeholder treści „tu wejdzie Home".

**Gotowe kiedy:**
- Home (placeholder) ładuje się w obu motywach, toggle przełącza, stan zapisuje się w `localStorage`, brak FOUC.
- Hamburger działa na <720px.
- Skip-link działa po `Tab`.
- `pnpm build` → pełny statyczny build bez ostrzeżeń.

**Poza zakresem:** treść Home, blog, formularze, zdjęcia.

---

## Iteracja 2 — Home page (≈400-600 linii)

**Cel:** Pełna strona główna 1:1 z prototypem, z 3 wpisami mockowymi.

**Prompt do Claude Code:**
> Iteracja 2 wg `iteracje-claude-code.md`. Zbuduj Home (`src/pages/index.astro`) wg sekcji 5.2 spec. Komponenty: `Hero.astro` (asymetryczny, portret placeholder 4/5 z `margin-bottom: -120px` desktop, H1 manifest, sub italic), `PostCard.astro` (meta italic → H3 link → lead → read-more), `NewsletterInline.astro` (literacki form, bez boxa — input z bottom-border + italic button; na razie bez backendu, submit robi `e.preventDefault()` i zmienia tekst buttona na *„— jest, do czwartku."*), `NieJaTeaser.astro` (grid 1fr 2fr, placeholder okładki z napisem *„Nie ja"*, badge *„rękopis w redakcji"*). Wpisy: 3 sztuki w mockowej tablicy w pliku (nie w MDX jeszcze). Portret placeholder: SVG inline z ramką (4/5), kolor `--bg-alt`, bez zewnętrznego obrazu. Meta Home + OG.

**Do zrobienia:**
- `src/components/Hero.astro`, `src/components/PostCard.astro`, `src/components/NewsletterInline.astro` (wariant: `variant="default" | "nie-ja"`), `src/components/NieJaTeaser.astro`, `src/components/PortraitPlaceholder.astro` (svg z ratio prop).
- `src/pages/index.astro` — składa Hero + Ornament + sekcja „Ostatnie teksty" (3 `PostCard`) + Ornament + NewsletterInline + Ornament + NieJaTeaser.
- Inline script dla formularza (toggle tekstu buttona po submit).
- JSON-LD `Person` w `BaseLayout` (via slot lub prop) na Home.

**Gotowe kiedy:**
- Home odwzorowuje `szmidtke-pl-ux-final.html` pixel-bliskie (asymetria hero, ornamenty, newsletter literacki).
- Lighthouse ≥95 na Performance na Home (bez obrazów prawdziwych — same placeholdery, więc łatwe).
- Mobile: portret nad tekstem, wszystko jednokolumnowe.

**Poza zakresem:** prawdziwy submit formularza (iteracja 5), prawdziwe wpisy (iteracja 3), prawdziwe zdjęcia (poza kodem).

---

## Iteracja 3 — Blog: index, pojedynczy wpis, content collections (≈500-700 linii)

**Cel:** Wpisy MDX działają, lista z filtrem kategorii i paginacją, pojedynczy wpis z drop capem.

**Prompt do Claude Code:**
> Iteracja 3 wg `iteracje-claude-code.md`. Zdefiniuj content collection `blog` w `src/content/config.ts` ze schematem Zod: `title` (string), `date` (date), `category` (enum: `esej | obserwacja | fragment | zespol`), `lead` (string, 1-2 zdania), `readingTime` (string słownie, np. „sześć minut"), `draft` (bool, default false), `tags` (array string optional), `slug` (override optional). Stwórz 3 przykładowe pliki MDX w `src/content/blog/` z prawdziwą zawartością literacką do testu (dropcap, cytat blokowy, śródtytuł, obraz inline placeholder). Strona `/blog` (`src/pages/blog/index.astro`): H1 *„Piszę"*, subtitle, inline filtr kategorii (linki do `/blog` i `/blog/kategoria/[nazwa]`), lista `PostCard` z hairline borderami, paginacja 10/stronę (*„← poprzednie"* / *„kolejne 10 →"*). Strona pojedynczego wpisu (`src/pages/blog/[...slug].astro`): meta italic, H1, lead, body MDX z klasą `.has-dropcap` na pierwszym `<p>` (auto przez rehype plugin lub manualnie w komponencie `PostBody`), cytaty, inline images, stopka wpisu (opt-in italic + „zobacz też" + 2 linki). Strony kategorii `/blog/kategoria/[nazwa].astro` z `getStaticPaths`. RSS jeszcze nie (iteracja 6).

**Do zrobienia:**
- `src/content/config.ts` — schemat.
- 3 przykładowe wpisy MDX z frontmatter + body z dropcapem, blockquote, inline img (placeholder svg), śródtytułem.
- `src/pages/blog/index.astro` — nagłówek + filtr + lista + paginacja.
- `src/pages/blog/[...slug].astro` — pojedynczy wpis.
- `src/pages/blog/kategoria/[nazwa].astro` — filtrowana lista.
- `src/components/PostBody.astro` — wrapper na `<Content />` z klasą na pierwszym akapicie (np. JS dodający klasę po renderze albo komponent `<FirstPara>` w MDX; rekomendowane: rehype plugin dodający klasę do pierwszego `p` w body).
- `src/components/PostFooter.astro` — opt-in + „zobacz też" (2 linki — na razie: ostatnie 2 wpisy z tej samej kategorii).
- `src/components/Pagination.astro`.
- `src/components/CategoryFilter.astro`.
- JSON-LD `BlogPosting` w layout wpisu.
- Funkcja `slugify` dla polskich znaków w `src/utils/slug.ts` (na wypadek niestandardowych slugów).

**Gotowe kiedy:**
- `/blog` pokazuje 3 wpisy, filtr kategorii przełącza listę.
- `/blog/[slug]` dowolnego z 3 wpisów renderuje się z drop capem na pierwszym akapicie (nie na leadzie), cytatem blokowym, obrazem inline.
- Paginacja pokazuje się dopiero przy >10 wpisach (na razie ukryta lub disabled).
- Build statyczny bez błędów.

**Poza zakresem:** RSS, prawdziwe zdjęcia, related posts algorytmem (na razie „ostatnie 2 z kategorii"), migracja 40 archiwalnych wpisów.

---

## Iteracja 4 — About + Nie ja + 404 (≈300-450 linii)

**Cel:** Reszta statycznych podstron.

**Prompt do Claude Code:**
> Iteracja 4 wg `iteracje-claude-code.md`. `src/pages/o-mnie.astro` wg sekcji 5.5: container 960px, grid 2fr 3fr ≥900px, `bg-alt` jako tło sekcji, drugi portret placeholder (3/4), H2 *„O mnie"*, pełny tekst placeholderem (marker `[COPY: about]` w komentarzu HTML, żeby Marcin wiedział, gdzie wklei prawdziwy tekst z `szmidtke-pl-copy-strona-v1.md` jeśli istnieje), kontakt inline w ostatnim akapicie. `src/pages/nie-ja.astro` wg 5.6: teaser z `NieJaTeaser` (wariant `full`), sekcja Fragment (680px, border top+bottom, label *„fragment z rozdziału czwartego"*, 400-800 słów lorem literacki), Ornament, `NewsletterInline` wariant `nie-ja` z odpowiednim copy. `src/pages/404.astro` — literackie: *„Nie ma tego, czego szukasz. Jest to, co mam."* + link do `/` i `/blog`, stopka globalna. Dodaj linki w nawigacji jeśli jeszcze ich nie ma: *Piszę · O mnie · Nie ja · Newsletter* (Newsletter = anchor `/#newsletter` w v1).

**Do zrobienia:**
- `src/pages/o-mnie.astro`.
- `src/pages/nie-ja.astro`.
- `src/pages/404.astro`.
- Rozszerzenie `NieJaTeaser.astro` o wariant `full` (z akapitem o procesie pisania) albo osobny `NieJaHero.astro`.
- Rozszerzenie `NewsletterInline.astro` o wariant `nie-ja`.
- Aktualizacja `SiteHeader.astro` — anchor `/#newsletter` (na Home dodaj `id="newsletter"` na sekcji NewsletterInline z iteracji 2).

**Gotowe kiedy:**
- 3 nowe strony się renderują, dark mode działa na każdej.
- Mobile układ jednokolumnowy poprawny.
- `/404` rzeczywiście działa jako Astro 404 (ustawienie w `astro.config.mjs` jeśli potrzebne).

**Poza zakresem:** prawdziwy tekst About (czeka na Marcina), prawdziwy fragment Wersji, prawdziwa okładka.

---

## Iteracja 5 — Newsletter: integracja Buttondown (≈200-350 linii)

**Cel:** Formularz działa end-to-end — wpisujesz adres, trafia do Buttondown, button zmienia tekst.

**Prompt do Claude Code:**
> Iteracja 5 wg `iteracje-claude-code.md`. Stwórz endpoint `src/pages/api/subscribe.ts` (Astro server endpoint, `prerender=false`, output mode `server` lub `hybrid` — wybierz `hybrid`, zostawia resztę statyczną). Endpoint: POST z `email`, waliduje regex, woła `POST https://api.buttondown.email/v1/subscribers` z `Authorization: Token ${BUTTONDOWN_API_KEY}` z `import.meta.env`, zwraca JSON `{ ok: true }` lub `{ ok: false, error: string }`. Zaktualizuj `NewsletterInline.astro` — skrypt inline: on submit `fetch('/api/subscribe', ...)`, `aria-live="polite"` region pod formularzem, sukces: button = *„— jest, do czwartku."* + input wyczyszczony + disabled; błąd: italic text-muted pod formularzem *„Coś się zacięło. Spróbuj jeszcze raz lub napisz na kontakt@szmidtke.pl."*. Bez popupów, bez redirectów. Fallback bez JS: form ma `action="mailto:kontakt@szmidtke.pl"` z `method="get"` + `subject=Newsletter` — jeśli JS nie zadziała, klient maila się otworzy. Honeypot field (hidden input `website` — jeśli wypełniony → 200 bez wysyłki, żeby nie palić klucza API).

**Do zrobienia:**
- `astro.config.mjs` — `output: 'hybrid'` + adapter (`@astrojs/node` standalone — pasuje do deploy w Dockerze z nginx jako reverse proxy).
- `src/pages/api/subscribe.ts` — handler z walidacją + wywołaniem Buttondown + obsługą błędów (rate limit, invalid email, already subscribed — zwróć sukces przy „already subscribed").
- Aktualizacja `NewsletterInline.astro` + skrypt klienta.
- Honeypot.
- `.env.example` uzupełniony (był już w iteracji 0, potwierdź obecność `BUTTONDOWN_API_KEY`).
- Aktualizacja `README.md` — jak zdobyć klucz Buttondown.

**Gotowe kiedy:**
- Lokalnie z ustawionym `.env` formularz działa, adres pojawia się w panelu Buttondown.
- Nieprawidłowy email → błąd inline.
- Duplikat → sukces („już jesteś zapisany" logicznie, ale UI pokazuje tylko *„— jest, do czwartku."*).
- Bez JS (DevTools disable) → klient maila się otwiera.

**Poza zakresem:** potwierdzenie double opt-in (Buttondown obsługuje sam), sekwencja powitalna, analytics.

---

## Iteracja 6 — SEO: RSS, sitemap, robots, OG images, JSON-LD (≈300-450 linii)

**Cel:** Google i czytniki RSS widzą pełnię strony. Udostępnienie na LinkedIn ma ładny preview.

**Prompt do Claude Code:**
> Iteracja 6 wg `iteracje-claude-code.md`. RSS: `src/pages/rss.xml.ts` przez `@astrojs/rss`, ostatnie 20 wpisów, pełny `description` (lead) + `content:encoded` opcjonalnie. Sitemap: integracja `@astrojs/sitemap` była w iteracji 0 — potwierdź, dodaj `filter` ukrywający drafty. `public/robots.txt`: `User-agent: *`, `Allow: /`, `Sitemap: https://szmidtke.pl/sitemap-index.xml`. OG images: endpoint `src/pages/og/[...slug].png.ts` z `satori` + `@resvg/resvg-js` (lub `astro-og-canvas`) renderujący `1200x630` — tło `#FAF8F3` + noise (opcjonalnie), tytuł wpisu Newsreader 500 72px, stopka *„Marcin Szmidtke · szmidtke.pl"* italic 24px. Dla Home i About — statyczny OG z manifestem. JSON-LD: `BlogPosting` już w iteracji 3 — upewnij się że ma `headline`, `datePublished`, `author`, `image` (URL OG), `mainEntityOfPage`. `Person` na Home i About. Canonical + meta description w `BaseLayout` już były — zweryfikuj że każda strona przekazuje `title` i `description`.

**Do zrobienia:**
- `src/pages/rss.xml.ts`.
- `public/robots.txt`.
- `src/pages/og/[...slug].png.ts` (generator OG).
- Aktualizacja `BaseLayout.astro` — `<link rel="alternate" type="application/rss+xml">`, canonical, pełne OG tags, Twitter cards (`summary_large_image`).
- Aktualizacja wpisów w `src/content/config.ts` jeśli potrzeba pola `ogImage` (domyślnie: `/og/${slug}.png`).
- Stopka: `rss` link → `/rss.xml`.

**Gotowe kiedy:**
- `/rss.xml` waliduje się w czytniku (np. Feedly).
- `/sitemap-index.xml` listuje wszystkie strony poza draftami.
- `/og/[slug].png` zwraca PNG 1200x630 z tytułem.
- LinkedIn post inspector pokazuje poprawny preview dla Home i dowolnego wpisu.

**Poza zakresem:** zdjęcia autora w OG (wchodzi jak będą), analytics.

---

## Iteracja 7 — Performance, a11y, obrazy, polish (≈300-500 linii)

**Cel:** Lighthouse ≥95/100/100/100, czysty audyt WCAG, obrazy w trzech formatach.

**Prompt do Claude Code:**
> Iteracja 7 wg `iteracje-claude-code.md`. Audyt + fixy: (1) Obrazy — przenieś portrety placeholdery z SVG do prawdziwego komponentu `<Image>` (`astro:assets`) przygotowanego pod AVIF/WebP/JPG z `srcset` 400/800/1600. Dodaj folder `src/assets/` z READMEm o tym, gdzie wrzucić docelowe zdjęcia (`portret-home.jpg`, `portret-about.jpg`, `okladka-nie-ja.png`); komponent ma graceful fallback na SVG placeholder jeśli plik nie istnieje. (2) Fonty — preload krytycznych wariantów Newsreadera (400, 500, italic 400), subset do Latin Extended (żeby złapać polskie znaki), `font-display: swap`. (3) Kontrast — pogłęb `--text-muted` z `#9E9890` do `#8A857E` w light (4.5:1 na `#FAF8F3`) per spec sekcja 8. (4) Focus states — sprawdź wszystkie interaktywne elementy, `:focus-visible` + outline. (5) `prefers-reduced-motion` — zweryfikuj: wszystkie `transition` wyzerowane. (6) ARIA — ornament `aria-hidden`, skip-link, hamburger `aria-expanded`, form `aria-live`. (7) Lighthouse audit (skrypt w package.json: `pnpm lhci` via `@lhci/cli` — opcjonalnie, albo opisz jak odpalić ręcznie). Zaraportuj wyniki.

**Do zrobienia:**
- Komponent `src/components/SmartImage.astro` korzystający z `astro:assets` + fallback.
- `src/assets/README.md` z instrukcją co i gdzie wrzucić.
- Font preload w `BaseLayout`.
- Aktualizacja tokena `--text-muted` w `global.css`.
- Review wszystkich fokus states — `:focus-visible` nie `:focus`.
- Media query `@media (prefers-reduced-motion: reduce)` globalnie + inline skrypty szanują `window.matchMedia`.
- `package.json` — opcjonalnie skrypt `lhci`.

**Gotowe kiedy:**
- Lighthouse (desktop): Performance ≥95, Accessibility 100, Best Practices 100, SEO 100.
- Mobile: Performance ≥90 dopuszczalne, reszta 100.
- axe DevTools: zero krytycznych błędów.
- Tab nav: każdy interaktywny element dostępny z klawiatury w sensownej kolejności.

**Poza zakresem:** docelowe zdjęcia (czekają na sesję fotograficzną), Plausible (iteracja 9).

---

## Iteracja 8 — Docker + deploy na VPS (≈200-350 linii)

**Cel:** Jeden commit → buduje się kontener, wgrywa na VPS, odpala się za nginx. Marcin umie wywołać deploy jedną komendą.

**Prompt do Claude Code:**
> Iteracja 8 wg `iteracje-claude-code.md`. Multi-stage `Dockerfile`: stage 1 `node:20-alpine` → `pnpm install && pnpm build`; stage 2 `node:20-alpine` z tylko `dist/` + `node_modules/@astrojs/node` + `package.json` produkcyjne → `CMD ["node", "./dist/server/entry.mjs"]` (bo mamy `output: hybrid` z adapterem Node standalone z iteracji 5). Port 3000 exposed. `docker-compose.yml`: serwis `web` (build z Dockerfile, `restart: unless-stopped`, env z `.env`), wskaż że nginx na VPS już ma reverse proxy — daj przykład bloku `nginx.conf.example` w repo (`proxy_pass http://127.0.0.1:3000;`, gzip, cache static 1 rok, SSL via Certbot — Marcin ma swoje). `.dockerignore`. **Dwa remote'y w gicie:** `origin = https://github.com/ochhyes/szmidtkepl.git` (źródło prawdy, GitHub) oraz `vps = ssh://vps/opt/szmidtke.git` (bare repo na VPS, deploy). Workflow: Marcin robi `git push origin main` (backup + źródło prawdy) oraz `git push vps main` (deploy) — lub jedno polecenie `git push origin main vps main`. Bare repo na VPS z `post-receive` hookiem robi `git --work-tree=/opt/szmidtke/app --git-dir=/opt/szmidtke.git checkout -f main && cd /opt/szmidtke/app && docker compose build && docker compose up -d`. Alternatywa: GitHub Actions deploy z push na main (opisz jako opcję „później" w `DEPLOY.md`, na razie idziemy prosto). Opisz w `DEPLOY.md`: jak raz skonfigurować VPS (bare repo, hook, env), jak dodać oba remote'y lokalnie, jak wygląda deploy, jak rollback (`git push vps <poprzedni-commit>:main -f` — tylko w awarii).

**Do zrobienia:**
- `Dockerfile` (multi-stage).
- `docker-compose.yml`.
- `.dockerignore`.
- `nginx.conf.example` (referencyjny blok, nie do podmiany całego nginx-a VPS).
- `scripts/deploy.sh` (skrót: `git push origin main && git push vps main`).
- `DEPLOY.md` — instrukcja setupu VPS krok po kroku: bare repo, hook, env, DNS, SSL certbot, pierwszy deploy, rollback. Sekcja o dwóch remote'ach (GitHub `origin` + VPS `vps`) i dlaczego trzymamy oba.

**Gotowe kiedy:**
- Lokalnie `docker compose up --build` stawia aplikację na `localhost:3000`.
- Na VPS po `git push vps main` aplikacja rebuilduje się i restartuje bez downtime ≥3s.
- `DEPLOY.md` czyta się i da się z niego zrobić setup od zera.

**Poza zakresem:** CI w GitHub Actions (opcja na później), monitoring, backup (osobny proces).

---

## Iteracja 9 — Migracja treści z archiwum (≈300-600 linii; może wymagać 2 sesji)

**Cel:** 15-20 przepisanych wpisów w repo. Pozostałe zarchiwizowane (nie usunięte).

*Uwaga: ta iteracja wymaga wejściowych materiałów od Marcina — pliki starych artykułów w formie (HTML/DOCX/markdown). Bez nich nie startuje.*

**Prompt do Claude Code:**
> Iteracja 9 wg `iteracje-claude-code.md`. Marcin wrzuci do folderu `_archive-raw/` pliki starych artykułów. (1) Skrypt `scripts/import.mjs`: czyta wszystkie pliki z `_archive-raw/`, dla każdego wyciąga tytuł + datę + body, konwertuje HTML → Markdown (`turndown`), generuje slug polski-do-asci, proponuje `category` na podstawie heurystyki słów kluczowych (do weryfikacji), tworzy plik `src/content/blog/[slug].mdx` z frontmatter + body. `draft: true` domyślnie na wszystkich — Marcin ręcznie odznacza po przeglądzie. (2) Lista raport w `MIGRACJA-REPORT.md`: tabela [tytuł, data, proponowana kategoria, liczba słów, stan]. (3) Folder `_archive-offline/` — pliki, które Marcin oznaczy do archiwizacji; skrypt je tam przesuwa, nie do repo głównego (poza git lub w osobnym branchu `archive`). Nie dotykaj tekstu literackiego — to Marcin redaguje ręcznie po imporcie. Nie usuwaj niczego.

**Do zrobienia:**
- `scripts/import.mjs` z zależnościami `turndown`, `gray-matter`, `slugify`.
- `MIGRACJA-GUIDE.md` — jak uruchomić, co robić po imporcie.
- Raport `MIGRACJA-REPORT.md` generowany przy uruchomieniu skryptu.
- `.gitignore` uzupełnione o `_archive-raw/` i `_archive-offline/`.

**Gotowe kiedy:**
- Na próbce 5 plików skrypt generuje 5 MDX-ów z poprawnym frontmatter i sensowną konwersją markdown.
- Raport zawiera wszystkie pliki z proponowanymi kategoriami.

**Poza zakresem:** sama redakcja tekstów — to ręczna robota Marcina, nie Claude Code (spec: "przepisanie 15-20 pod nowy rejestr").

---

## Iteracja 10 (opcjonalna) — Plausible + drobne dopinki (≈150-250 linii)

**Cel:** Self-hosted analytics + 404 polish + RSS przycisk w stopce + cokolwiek zostało.

**Prompt do Claude Code:**
> Iteracja 10 wg `iteracje-claude-code.md` (opcjonalna). Plausible self-hosted: dodaj do `docker-compose.yml` serwis `plausible` (z oficjalnego obrazu `plausible/analytics:latest`) + `postgres` + `clickhouse` wg docs Plausible. Skrypt trackingu w `BaseLayout` tylko jeśli `PUBLIC_PLAUSIBLE_DOMAIN` ustawiony w env. Bez cookies, RODO-friendly — potwierdź w stopce: *„Strona zbiera anonimowe statystyki odwiedzin (Plausible). Bez cookies, bez trackerów zewnętrznych."* Podmień tekst w stopce. Dopinki: (a) 404 z linkami do 3 losowych wpisów, (b) strona `/piszę` jako alias dla `/blog` (redirect w `astro.config`), (c) favicon SVG (inicjał „M" w Newsreaderze na `#FAF8F3` + burgundy).

*Ta iteracja jest nice-to-have. Można pominąć — statystyki można włączyć później.*

---

## Kolejność i czas

| # | Iteracja | Zależy od | Szacowany effort Claude Code |
|---|----------|-----------|------------------------------|
| 0 | Setup | — | 1 sesja krótka |
| 1 | Design system + layout | 0 | 1 sesja |
| 2 | Home | 1 | 1 sesja |
| 3 | Blog | 1 | 1 sesja długa |
| 4 | About + Nie ja + 404 | 1 | 1 sesja |
| 5 | Newsletter Buttondown | 2, 4 | 1 sesja |
| 6 | SEO | 3 | 1 sesja |
| 7 | Perf + a11y polish | 3, 6 | 1 sesja |
| 8 | Docker + deploy | 5, 7 | 1 sesja |
| 9 | Migracja treści | 3, materiały od Marcina | 1-2 sesje |
| 10 | Plausible + polish | 8 | 1 sesja (opcjonalna) |

**Realna ścieżka do go-live:** iteracje 0-8 = **8 sesji**, między nimi review i ew. poprawki. Migracja (9) równolegle z 5-8 jeśli Marcin ma już materiały.

---

## Co Marcin dostarcza przed którą iteracją

| Przed iteracją | Potrzebne od Marcina |
|----------------|----------------------|
| 0 | Nic — sam kod |
| 2 | Nic (placeholdery) — docelowo: 1 zdanie manifest do H1 (już jest w spec), portret do hero (nice-to-have, ale działamy na placeholderze) |
| 4 | Tekst About (jeśli gotowy plik `szmidtke-pl-copy-strona-v1.md` — wklejamy; inaczej placeholder), fragment Wersji 400-800 słów |
| 5 | Klucz API Buttondown |
| 6 | Nic |
| 7 | Docelowe zdjęcia (jeśli są — inaczej zostają placeholdery, sesja fotograficzna potem) |
| 8 | Dostęp SSH do VPS (lub zrób sam setup wg DEPLOY.md), domena szmidtke.pl gotowa do przełączenia DNS |
| 9 | Pliki archiwum 40 artykułów |

---

## Zasady dla Claude Code w każdej iteracji

- **Czytaj spec i prototyp przed pisaniem** — nie zgaduj designu.
- **Nie wymyślaj komponentów „na zapas"** — tylko to, co w iteracji.
- **Commit na końcu** z komunikatem `iteration N: [krótki opis]`.
- **Raport końcowy 5-10 linii**: co zrobione, czego brakuje, potencjalne blokery dla następnej iteracji.
- **Jeżeli coś ze spec jest sprzeczne / niejasne** — spytaj w raporcie, nie improwizuj.
- **Nie dodawaj zewnętrznych bibliotek** poza tymi wymienionymi w iteracji (żeby nie rozrosło się bundle).
- **TypeScript strict, zero `any`**, zero `// @ts-ignore` bez komentarza uzasadniającego.

---

*Plan PM, v1, 2026-04-22. Edytowalny — jeśli iteracja okaże się za duża, rozbijamy dalej. Jeśli za mała, łączymy.*
