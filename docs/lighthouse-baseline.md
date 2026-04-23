# Lighthouse — baseline (przed iter 21)

*Lokalnie, node ./dist/server/entry.mjs na 127.0.0.1, headless Chrome przez `npx lighthouse`. Wynik produkcyjny z nginx + CDN + gzip będzie lepszy (kompresja, cache, realne HTTP/2).*

## Wynik — home desktop (pojedynczy run, 2026-04-23)

| Kategoria | Score | Notatka |
|-----------|-------|---------|
| Performance | **94** | FCP 1.2 s, LCP 1.2 s, TBT 0 ms, CLS 0.001 |
| Accessibility | **100** | — |
| Best Practices | **100** | — |
| SEO | **100** | — |

## Top issues

1. **LCP request discovery** (score 0.00) — portret hero nie miał `fetchpriority="high"`, browser odkrywał plik dopiero po sparsowaniu CSS.
2. **Render-blocking resources** (score 0.50) — Google Fonts CSS jako `rel="stylesheet"` blokował render.
3. **Text compression** (score 0.00) — node preview nie gzipuje (nginx produkcyjny tak).
4. **Heading order** (score 0.00, widoczne na innych stronach) — `PostCard` używał `<h3>` po `<h1>` strony = pominięty `<h2>`. Footer `<h4>` po `<h1>`.
5. **Label content name mismatch** (score 0.00) — theme toggle miał `aria-label` który nie zawierał widocznego tekstu ("tryb ciemny ↺" vs "Przełącz motyw jasny/ciemny").
6. **LCP lazy-loaded** (o-mnie) — `SmartImage` z portretem About miał domyślne `loading="lazy"`.

## Zakres fixów (iter 21)

1. **`SmartImage.astro`** — prop `fetchpriority`, forward na `<Picture>`.
2. **`Hero.astro`** — `fetchpriority="high"` na portrecie home.
3. **`o-mnie.astro`** — `loading="eager"` + `fetchpriority="high"` na portrecie About; `h2` → `h1` (strona nie miała h1).
4. **`BaseLayout.astro`** — Google Fonts CSS: `rel="preload"` + `onload="this.rel='stylesheet'"` (non-blocking) + `<noscript>` fallback.
5. **`PostCard.astro`** — `<h3>` → `<h2>` (kart wpisów na home i /blog).
6. **`PostFooter.astro`**, **`SiteFooter.astro`** — `<h4>` → `<h2>` dla nagłówków sekcji footerów + dopasowanie CSS.
7. **`SiteFooter.astro`** — usunięty zbędny `aria-label` z theme toggle (widoczny tekst wystarcza jako accessible name; zostaje `title` jako tooltip).

## Plus — fix Sprint 1 długu (dołączony do iter 21)

8. **`index.astro`** — `mockPosts` (pozostałość po iter 2) podmieniony na `(await getPublishedPosts()).slice(0, 3)`. Home ciągnie aktualne trzy najnowsze wpisy z content collection.
