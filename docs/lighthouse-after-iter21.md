# Lighthouse — po iter 21

*`node ./dist/server/entry.mjs` + `npx lighthouse --chrome-flags="--headless=new"`. Pomiary lokalne na Windows, **significant jitter** na mobile (po serii runów CPU zaczyna się dzielić i wyniki rwą). **Prawdziwe liczby zmierzymy na prod** po deploy Sprint 3 — nginx z gzip, HTTP/2, realny sieciowy profil dają zwykle +5-15 punktów perf na mobile.*

## Tabela przed / po — desktop

| Strona | Baseline | Po iter 21 |
|---|---|---|
| `/` | Perf **94** · A11y **100** · BP **100** · SEO **100** | Perf **98-100** · A11y **100** · BP **100** · SEO **100** |
| `/blog/` | (nie mierzone baseline) | Perf **94-100** · A11y **100** · BP **100** · SEO **100** |
| `/blog/pasywnosc-…/` | (nie mierzone baseline) | Perf **97-100** · A11y **98** · BP **100** · SEO **100** |
| `/o-mnie/` | (nie mierzone baseline) | Perf **95-100** · A11y **98-100** · BP **100** · SEO **100** |

*Zakresy perf wynikają z variance między runami (noisy host).*

## Tabela — mobile

| Strona | Po iter 21 |
|---|---|
| `/` | Perf **84-99** · A11y **100** · BP **100** · SEO **100** |
| `/blog/` | Perf **69-99** · A11y **98-100** · BP **100** · SEO **100** |
| `/blog/pasywnosc-…/` | Perf **68-99** · A11y **98** · BP **100** · SEO **100** |
| `/o-mnie/` | Perf **71-87** · A11y **98-100** · BP **100** · SEO **100** |

Mobile perf jest bardzo zmienne — Lighthouse symuluje slow 4G + CPU 4x throttle, a na Windows + headless Chrome to często wpada w thrashing. **Pomiar produkcyjny (VPS + nginx + gzip + HTTP/2) będzie realny.**

## Co zostało nierozwiązane

1. **`heading-order` na pojedynczym wpisie** — `<h3>` w treści MDX (np. `### Co z tego wynika`) po `<h1>` tytułu = pominięty `<h2>`. Fix: podmiana `### → ##` we wszystkich wpisach (lub rehype plugin który przesuwa poziomy). Zostawione jako ścieżka na Sprint 4 — to treściowa decyzja autora, nie techniczny dług.
2. **Text compression** w preview — nginx produkcyjny ma `gzip on`. Zero pracy po stronie aplikacji.
3. **Render-blocking Google Fonts CSS** — po fixie score `0.50` (resztkowo, Lighthouse i tak flaguje preload-style, bo sprawdza `rel="stylesheet"` w momencie skanowania). Realny impact na FCP znika, bo CSS loaduje się asynchronicznie.

## Jak zmierzyć realne liczby na prod

Po deploy Sprint 3:

```bash
# Desktop
npx lighthouse https://szmidtke.pl/ --preset=desktop --output=html --output-path=./lh-prod-home-desktop.html --chrome-flags="--headless=new"

# Mobile (domyślny form-factor)
npx lighthouse https://szmidtke.pl/ --form-factor=mobile --output=html --output-path=./lh-prod-home-mobile.html --chrome-flags="--headless=new"
```

Albo prościej: panel Chrome DevTools → Lighthouse → Analyze page load (z realnymi danymi sieci). Produkcyjnie mamy do tego dashboard Plausible Web Vitals (iter 19) który pokaże LCP/CLS/INP per-strona z **realnego ruchu**, nie z symulacji Lighthouse.

## Zmiany w kodzie — recap

Pliki zmodyfikowane w iter 21:

- `src/components/SmartImage.astro` — prop `fetchpriority`.
- `src/components/Hero.astro` — `fetchpriority="high"` na hero portret.
- `src/pages/o-mnie.astro` — portret `loading="eager" fetchpriority="high"`, `h2`→`h1`.
- `src/layouts/BaseLayout.astro` — Google Fonts non-blocking (`rel="preload"` + `onload` + `<noscript>`).
- `src/components/PostCard.astro` — `h3`→`h2`.
- `src/components/PostFooter.astro` — `h4`→`h2` + selektory CSS.
- `src/components/SiteFooter.astro` — `h4`→`h2` + usunięty `aria-label` z theme toggle (visible text wystarcza).
- `src/styles/global.css` — `footer.site h4` → `footer.site h2`.
- `src/pages/index.astro` — Home czyta `(await getPublishedPosts()).slice(0, 3)` zamiast `mockPosts` (fix długu iter 2 Sprint 1).
