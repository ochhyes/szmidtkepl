# szmidtke.pl

Strona osobista Marcina Szmidtke — blog autorski, strona powieści *Wersje*, literacki newsletter.

**Stack:** Astro 5 + MDX + czysty CSS (custom properties). TypeScript strict. Hosting: kontener Docker + nginx na VPS.

Repo: https://github.com/ochhyes/szmidtkepl

---

## Wymagania

- Node 20+ (testowane na 22)
- npm 10+ (fallback; docelowo pnpm, ale plan dopuszcza npm)

## Setup lokalny

```bash
npm install
cp .env.example .env
# Uzupełnij BUTTONDOWN_API_KEY jeśli chcesz testować newsletter
npm run dev
```

Strona: http://localhost:4321

## Polecenia

| Polecenie | Opis |
|-----------|------|
| `npm run dev` | Dev server z hot-reload |
| `npm run build` | Build produkcyjny (`astro check` + `astro build`) do `dist/` |
| `npm run preview` | Preview zbudowanej strony lokalnie |
| `npm run check` | TypeScript + Astro type-check (bez builda) |

## Struktura

```
src/
  layouts/       Layouty (BaseLayout z <head>, headerem, stopką)
  components/    Komponenty Astro (Hero, PostCard, NewsletterInline, …)
  pages/         Routes: index, blog/, o-mnie, wersje, 404
  content/
    blog/        Wpisy MDX z frontmatter
    config.ts    Schemat content collection (Zod)
  styles/        global.css — tokeny, reset, typografia, dark mode
  scripts/       theme.js (inline w <head>), menu.js (drawer mobile)
  utils/         slug, helpers
public/          Statyczne assety (favicon, og fallback, robots)
docs/            Plan iteracji, spec UX, prototyp HTML
```

## Dokumentacja projektu

Folder `docs/` zawiera:
- `iteracje-claude-code.md` — plan PM rozbity na iteracje
- `szmidtke-pl-ux-design-spec.md` — spec UX v2 (źródło prawdy)
- `szmidtke-pl-ux-final.html` — wzorzec wizualny 1:1

## Newsletter (Buttondown)

1. Załóż konto na https://buttondown.email (darmowy plan wystarcza na start).
2. Weź klucz z https://buttondown.email/settings/programming.
3. Wklej do `.env` jako `BUTTONDOWN_API_KEY=...`.
4. Uruchom `npm run dev` — formularz na Home i stronie Wersje wysyła do `/api/subscribe`, który przekazuje do Buttondown.

Zachowanie:
- Sukces → button zmienia tekst na *„— jest, do czwartku."* (wariant Home) lub *„— dam znać."* (Wersje).
- Duplikat → również sukces (Buttondown zwraca 400 z `already_subscribed`; obsługujemy jako „już jesteś").
- Błąd walidacji → mikrocopy pod formularzem zmienia się na komunikat błędu.
- Honeypot (hidden input `website`) chroni przed botami bez palenia klucza API.
- Fallback bez JS: formularz ma `action="mailto:kontakt@szmidtke.pl?subject=Newsletter"` — klient maila otwiera się przy submit.

Tryb `output: hybrid` — Astro prerenderuje wszystko statycznie oprócz `src/pages/api/*`, które działa jako Node server endpoint (adapter `@astrojs/node` standalone, port 3000).

## Deploy

Szczegóły w `DEPLOY.md` (iteracja 8). Skrót:

```bash
git push origin main   # backup + źródło prawdy (GitHub)
git push vps main      # deploy na VPS (post-receive hook → docker compose up -d)
```

---

*Projekt zgodny ze specyfikacją `docs/szmidtke-pl-ux-design-spec.md`.*
