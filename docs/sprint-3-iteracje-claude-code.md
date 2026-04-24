# Sprint 3 — iteracje dla Claude Code, szmidtke.pl

*Handoff dla Claude Code. Pełny audyt PM i uzasadnienia → `C:\Users\ochhy\OneDrive\Claude\szmidtke-pl-rebrand\sprint-3-plan.md`. Tu są tylko prompty, do-zrobienia, definition-of-done.*

**Wejście dla Claude Code (zawsze):**
- `docs/szmidtke-pl-ux-design-spec.md` — źródło prawdy designowej.
- `docs/szmidtke-pl-ux-final.html` — wzorzec wizualny.
- `docs/iteracje-claude-code.md` — Sprint 1 (zamknięty).
- `docs/sprint-2-iteracje-claude-code.md` — Sprint 2 (zamknięty).
- `docs/sprint-3-iteracje-claude-code.md` — ten plik.

**Zasady:**
1. Każda iteracja = osobna sesja.
2. Commit na końcu każdej iteracji.
3. Raport końcowy 5-10 linii.
4. Niejasności → spytaj, nie improwizuj.
5. TypeScript strict, zero `any`.

**Kolejność:** 18, 19, 20, 22 niezależne (różne pliki) — w dowolnej kolejności. **21 (Lighthouse) najlepiej na końcu** żeby zmierzyć efekt poprzednich. **23** to dopinki, kiedy chcesz.

---

## Iteracja 18 — Sitemap exclude /zapisany + analytics robots + BreadcrumbList

**Cel:** SEO hygiene. `/zapisany` znika z sitemap. Plausible dashboard dostaje `Disallow`. Wpisy bloga dostają BreadcrumbList strukturę.

**Prompt:**
> Iteracja 18 wg `docs/sprint-3-iteracje-claude-code.md`. Trzy dopinki SEO.
>
> **1. Wykluczenie `/zapisany` z sitemap.**
> - `astro.config.mjs` — w `sitemap({ filter: ... })` rozszerz: `(page) => !page.includes('/api/') && !page.endsWith('/zapisany') && !page.endsWith('/zapisany/')`. Strona ma `noindex` w meta, ale powinna też wypaść z sitemap.
>
> **2. `robots.txt` dla `analytics.szmidtke.pl`.**
> - W `nginx.conf.example` w bloku `analytics.szmidtke.pl` dodaj **PRZED** `location /` (kolejność istotna):
>   ```nginx
>   location = /robots.txt {
>       add_header Content-Type text/plain;
>       return 200 "User-agent: *\nDisallow: /\n";
>   }
>   ```
>
> **3. BreadcrumbList JSON-LD na pojedynczym wpisie.**
> - W `src/pages/blog/[...slug].astro` — rozszerz `jsonLd` używając `@graph` (jeden script tag z dwoma typami):
>   ```ts
>   const jsonLd = {
>     '@context': 'https://schema.org',
>     '@graph': [
>       {
>         '@type': 'BlogPosting',
>         // ... istniejące pola
>       },
>       {
>         '@type': 'BreadcrumbList',
>         itemListElement: [
>           { '@type': 'ListItem', position: 1, name: 'Marcin Szmidtke', item: siteUrl },
>           { '@type': 'ListItem', position: 2, name: 'Piszę', item: new URL('/blog', siteUrl).toString() },
>           { '@type': 'ListItem', position: 3, name: post.data.title, item: canonical },
>         ],
>       },
>     ],
>   };
>   ```
> - Sprawdź `https://search.google.com/test/rich-results` po deploy — powinien rozpoznać BreadcrumbList.
>
> Commit: `iteration 18: sitemap exclude /zapisany + analytics robots + breadcrumb json-ld`.

**Do zrobienia:**
- `astro.config.mjs` — rozszerz filter sitemap.
- `nginx.conf.example` — `location = /robots.txt` w bloku analytics.
- `src/pages/blog/[...slug].astro` — `BreadcrumbList` w `jsonLd` jako `@graph`.

**Gotowe kiedy:**
- `dist/sitemap-0.xml` po `npm run build` **nie zawiera** `/zapisany`.
- Po deploy `https://analytics.szmidtke.pl/robots.txt` zwraca `User-agent: *\nDisallow: /`.
- Google Rich Results Test pokazuje BreadcrumbList.

**Poza zakresem:**
- BreadcrumbList na innych stronach (1-poziomowe).

---

## Iteracja 19 — Plausible custom event + Web Vitals

**Cel:** Mierzysz konwersję newsletter signup. Web Vitals widoczne w panelu.

**Prompt:**
> Iteracja 19 wg `docs/sprint-3-iteracje-claude-code.md`. Plausible — z pageviews na realny insight.
>
> **1. Custom event "Newsletter Signup".**
> - W `NewsletterInline.astro` propsie `variant` przekaż jako `data-variant` na formularzu (`<form ... data-variant={variant}>`).
> - W JS handlerze success path, PRZED `setTimeout(() => window.location.href = '/zapisany', 1500)`:
>   ```js
>   if (typeof window.plausible === 'function') {
>     window.plausible('Newsletter Signup', { props: { variant: form.dataset.variant || 'default' } });
>   }
>   ```
> - Bez wywołania jeśli `window.plausible` undefined (dev bez Plausible) — żeby nie wywalać konsoli.
>
> **2. Web Vitals plugin.**
> - Plausible CE v2.1: sprawdź docs (`https://plausible.io/docs/web-vitals`) który wariant skryptu obsługuje Web Vitals — pewnie `script.hash.js` albo `script.tagged-events.js` lub złożenie. Wybierz właściwy i podmień `src` w `BaseLayout.astro:84`.
> - **Alternatywa:** jeśli docs Plausible CE v2.1 nie ma natywnego Web Vitals — zostaw script bez zmian, tylko **dopisz komentarz w BaseLayout**: *„Web Vitals będzie po update Plausible CE do wersji wspierającej (~v2.2). Gdy będzie — zmień src skryptu wg docs."*.
>
> **3. README update.**
> - W `README.md` sekcja Newsletter — dodaj akapit: *„Po dodaniu Plausible (sprint 3) konwersja signup mierzona jako custom event 'Newsletter Signup' z propsem `variant`. Goal w panelu Plausible."*
>
> Commit: `iteration 19: plausible custom event + web vitals docs`.

**Do zrobienia:**
- `NewsletterInline.astro` — `data-variant` + `window.plausible(...)` w success.
- `BaseLayout.astro` — komentarz/zmiana skryptu Web Vitals.
- `README.md` — wzmianka o tracking signup.

**Gotowe kiedy:**
- Test E2E: subskrypcja → Plausible Goals pokazuje "Newsletter Signup" +1.
- Web Vitals widoczne w panelu (po włączeniu pluginu w Settings → Extensions, akcja Marcina).

**Poza zakresem:**
- Tracking outbound clicks (przyszłość, jeśli przydatne).
- Funnel analysis (Plausible CE nie wspiera).

---

## Iteracja 20 — Security headers + www→non-www 301

**Cel:** Standardowe nagłówki HTTP (Mozilla Observatory grade A). Domena kanoniczna.

**Prompt:**
> Iteracja 20 wg `docs/sprint-3-iteracje-claude-code.md`. Bezpieczeństwo HTTP + kanoniczna domena.
>
> **1. Security headers w `nginx.conf.example`.**
> Do bloku głównego `server { server_name szmidtke.pl; ... }` (PO `gzip`, PRZED `location` blokami):
> ```nginx
> # Security headers — standard 2026 (Mozilla Observatory grade A).
> add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
> add_header X-Content-Type-Options "nosniff" always;
> add_header X-Frame-Options "DENY" always;
> add_header Referrer-Policy "strict-origin-when-cross-origin" always;
> add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
>
> # CSP — pierwsza wersja, kompromis z 'unsafe-inline' dla Astro inline scripts.
> # TODO Sprint 4: refactor na nonce (Astro 5 wspiera Astro.csp).
> add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://analytics.szmidtke.pl; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://analytics.szmidtke.pl; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
> ```
>
> `always` ważne — bez tego nginx pomija `add_header` na 4xx/5xx.
>
> **2. www → non-www 301.**
> Wytnij `www.szmidtke.pl` z `server_name` głównego serwera. Dodaj OSOBNE bloki PRZED głównym:
> ```nginx
> server {
>     listen 80;
>     server_name www.szmidtke.pl;
>     return 301 https://szmidtke.pl$request_uri;
> }
> server {
>     listen 443 ssl http2;
>     server_name www.szmidtke.pl;
>     # Certbot doda ssl_certificate dla www. po `certbot --nginx -d www.szmidtke.pl`
>     return 301 https://szmidtke.pl$request_uri;
> }
> ```
>
> **3. `DEPLOY.md` — sekcja weryfikacji.**
> Dodaj sekcję *„Security headers — pierwsza weryfikacja"*:
> - `curl -I https://szmidtke.pl` — sprawdź 6 nagłówków.
> - Mozilla Observatory: cel A.
> - SecurityHeaders.com: cel A.
> - Jeśli CSP coś psuje → zwęź / poszerz `script-src`.
> - **Wymagane przed deploy:** `certbot --nginx -d www.szmidtke.pl` (cert dla www).
>
> **4. `astro.config.mjs`.**
> Potwierdź `site: 'https://szmidtke.pl'` (bez www).
>
> Commit: `iteration 20: security headers + www-to-non-www redirect`.

**Do zrobienia:**
- `nginx.conf.example` — security headers + 2 osobne bloki www→non-www (HTTP + HTTPS).
- `DEPLOY.md` — sekcja Security headers.
- `astro.config.mjs` — potwierdzenie kanonika bez www.

**Gotowe kiedy:**
- `curl -I https://szmidtke.pl` zwraca 6 security headers.
- `https://www.szmidtke.pl/blog/X` → 301 → `https://szmidtke.pl/blog/X`.
- Mozilla Observatory: A lub wyżej.
- Strona działa bez błędów konsoli (CSP nie blokuje).

**Poza zakresem:**
- CSP z nonce (osobny refactor).
- SRI dla Plausible JS.
- HTTP/3.

---

## Iteracja 21 — Lighthouse audit + fixy

**Cel:** Twarde liczby przed/po. Nie deklaracje.

**Prompt:**
> Iteracja 21 wg `docs/sprint-3-iteracje-claude-code.md`. Performance + a11y audit z liczbami.
>
> **1. Setup baseline.**
> - `npm run build && npm run preview &` (port z config, pewnie 4321).
> - Lighthouse — Chrome DevTools Lighthouse panel (Desktop + Mobile osobno).
> - Audit dla 4 stron: `/`, `/blog`, `/blog/pasywnosc-ktora-wyglada-jak-odpoczynek`, `/o-mnie`.
> - Zapisz w `docs/lighthouse-baseline.md` jako tabela: strona × tryb × kategoria. Dla każdej oceny TOP 3 issues.
>
> **2. Fixy.**
> Najczęstsze:
> - **LCP** — hero portrait. Sprawdź `loading="eager"`, `fetchpriority="high"`, AVIF/WebP w `astro:assets`/`SmartImage.astro`.
> - **CLS** — fonty (jest `font-display: swap`), reserved space dla portretu.
> - **TBT** — JS bundle (powinno być minimalne).
> - **A11y** — kontrast, focus, ARIA, alt.
> - **SEO** — meta description, lang, canonical, tap targets mobile.
> - **BP** — security headers (po iter 20 = 100), brak deprecated APIs, brak console errors.
>
> Każdy fix — uzasadnienie w komentarzu kodu lub commit message body.
>
> **3. Report.**
> Po fixach uruchom Lighthouse ponownie. Zapisz `docs/lighthouse-after-iter21.md` z tabelą **przed/po**:
> ```
> | Strona | Tryb | Perf | A11y | BP | SEO |
> |--------|------|------|------|----|----|
> | / | Desktop | 88→97 | 95→100 | 92→100 | 100 |
> ```
>
> Commit: `iteration 21: lighthouse audit + perf/a11y fixes` z body listującym konkretne fixy.

**Do zrobienia:**
- `docs/lighthouse-baseline.md` — wyniki przed.
- Konkretne fixy w komponentach.
- `docs/lighthouse-after-iter21.md` — wyniki po + tabela.
- Lista fixów w commit message.

**Gotowe kiedy:**
- Desktop: Performance ≥95 na 4 stronach.
- Mobile: Performance ≥90, Accessibility 100, SEO 100.
- axe DevTools: zero krytycznych.
- Raport `lighthouse-after-iter21.md` w repo.

**Poza zakresem:**
- RUM (Plausible Web Vitals z iter 19 da realne dane prod).
- Optymalizacja fontów dalej niż swap.

---

## Iteracja 22 — Plausible `init-admin` fix + backup

**Cel:** Plausible nie crashuje. Backup ratuje statystyki.

**Prompt:**
> Iteracja 22 wg `docs/sprint-3-iteracje-claude-code.md`. Fix `init-admin` + daily backup.
>
> **1. Fix `init-admin` w `docker-compose.yml`.**
> - Linia ~73: zmień
>   ```yaml
>   command: sh -c "/entrypoint.sh db init-admin && /entrypoint.sh db migrate && /entrypoint.sh run"
>   ```
>   na
>   ```yaml
>   command: sh -c "/entrypoint.sh db migrate && /entrypoint.sh run"
>   ```
> - Komentarz przed `command`: *„NIE init-admin — wymaga ADMIN_USER_* których nie ustawiamy. Admin tworzony osobno przez `create-admin-user` exec po pierwszym starcie (DEPLOY.md krok 4)."*
>
> **2. `scripts/backup-plausible.sh`.**
> ```bash
> #!/usr/bin/env bash
> # Daily backup Plausible — postgres + clickhouse.
> # Cron: 0 4 * * * /opt/szmidtke/app/scripts/backup-plausible.sh >> /var/log/plausible-backup.log 2>&1
> set -euo pipefail
>
> BACKUP_DIR="/opt/backups/plausible"
> RETENTION_DAYS=14
> DATE=$(date +%F)
> COMPOSE="/opt/szmidtke/app/docker-compose.yml"
> mkdir -p "$BACKUP_DIR"
>
> docker compose -f "$COMPOSE" exec -T plausible_db \
>   pg_dump -U postgres plausible_db | gzip > "$BACKUP_DIR/pg-$DATE.sql.gz"
>
> docker compose -f "$COMPOSE" exec -T plausible_events_db \
>   clickhouse-client --query "SELECT * FROM plausible_events_db.events FORMAT TabSeparatedWithNames" \
>   | gzip > "$BACKUP_DIR/ch-events-$DATE.tsv.gz"
>
> docker compose -f "$COMPOSE" exec -T plausible_events_db \
>   clickhouse-client --query "SELECT * FROM plausible_events_db.sessions FORMAT TabSeparatedWithNames" \
>   | gzip > "$BACKUP_DIR/ch-sessions-$DATE.tsv.gz"
>
> find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -delete
>
> echo "[$(date -Iseconds)] Plausible backup OK: $DATE"
> ```
> chmod 755.
>
> **3. `DEPLOY.md` — sekcja Backup.**
> Dodaj sekcję *„Backup Plausible"*:
> - Co backupujemy.
> - Setup cron: `crontab -e` → `0 4 * * * /opt/szmidtke/app/scripts/backup-plausible.sh >> /var/log/plausible-backup.log 2>&1`.
> - Restore postgres: `gunzip < pg-2026-04-23.sql.gz | docker compose exec -T plausible_db psql -U postgres plausible_db`.
> - Restore ClickHouse: `gunzip < ch-events-X.tsv.gz | docker compose exec -T plausible_events_db clickhouse-client --query "INSERT INTO plausible_events_db.events FORMAT TabSeparatedWithNames"`.
> - **Test odzyskania** (rekomendacja): backup → drugi VPS testowy → restore → sprawdź panel.
> - Retention: 14 dni (`RETENTION_DAYS`).
> - Off-site: rekomendacja `rclone` do S3/Backblaze raz na dobę. **Out of scope iter 22, wzmianka.**
>
> Commit: `iteration 22: fix plausible init-admin + daily backup script`.

**Do zrobienia:**
- `docker-compose.yml` — usuń `db init-admin && `, dodaj komentarz.
- `scripts/backup-plausible.sh` (chmod 755).
- `DEPLOY.md` — sekcja Backup z setup + restore + test odzyskania.

**Gotowe kiedy:**
- `docker compose up -d` po edycji — Plausible startuje bez błędów (`docker compose logs plausible` → "Plausible is ready").
- `bash scripts/backup-plausible.sh` (po setup VPS) tworzy 3 pliki w `/opt/backups/plausible/`.
- DEPLOY.md ma instrukcję restore.

**Poza zakresem:**
- Off-site backup (wzmianka, nie implementacja).
- Backup szmidtke.pl (kod w git, treść w git, brak DB).

---

## Iteracja 23 — Widget statusu *Nie ja* + drobne polishy

**Cel:** Czytelnik widzi etap książki. Plus zamknięcie loose drobiazgów.

**Prompt:**
> Iteracja 23 wg `docs/sprint-3-iteracje-claude-code.md`. Widget statusu + dopinki.
>
> **1. Widget statusu *Nie ja*.**
> - `src/components/NieJaStatus.astro` — horizontal progress 5 etapów: `szkic → rękopis → redakcja → korekta → druk`. Aktualny: kolor accent. Wcześniejsze: filled muted. Kolejne: hairline.
> - Props: `current: 'szkic' | 'rekopis' | 'redakcja' | 'korekta' | 'druk'`. Default: `'redakcja'`.
> - Pod paskiem (italic, mała, `text-muted`) krótki tekst o etapie. Marker `[STATUS: nie-ja-etap]` żeby Marcin łatwo zmieniał tekst.
> - Wstaw na `/nie-ja` (`src/pages/nie-ja.astro`) między `NieJaTeaser variant="full"` a `nie-ja-fragment`. Z otoczeniem `<Ornament />` przed widgetem.
> - **Gdy `current === 'druk'`** — pokaż dodatkowo CTA *„kup w księgarni"* z markerem `[COPY: nie-ja-link-ksiegarnia]` (Marcin wstawi URL).
>
> **2. `_archive-raw/` — porządki.**
> - Sprawdź `.gitignore` — czy zawiera `_archive-raw/` (powinno być z iter 9, ale potwierdź).
> - Stwórz `_archive-raw/README.md`:
>   ```
>   # Archive raw
>
>   DOCX-y starych artykułów. Zaimportowane do `src/content/blog/` 2026-04-23 (5 plików).
>
>   Folder lokalny, gitignore'owany. Można usunąć po wyrażonym 'tak' Marcina —
>   wszystkie teksty są w MDX w `src/content/blog/` i w git history.
>   ```
> - **NIE usuwaj** samych DOCX-ów.
>
> **3. PostFooter querySelector scope.**
> - W `PostFooter.astro:64` (lub gdzie jest handler share-copy) zmień `document.querySelector('[data-share-copy]')` na `document.querySelectorAll('[data-share-copy]').forEach((btn) => { ... })`.
> - Wewnątrz forEach `const original = btn.textContent;` — niezależnie per button.
>
> **4. Atom feed.**
> - `src/pages/atom.xml.ts` — ręczny generator Atom 1.0 (nie ma natywnego wsparcia w `@astrojs/rss`):
>   ```ts
>   import { getPublishedPosts, formatPolishDate } from '../utils/posts';
>
>   export const prerender = true;
>
>   export async function GET() {
>     const posts = await getPublishedPosts();
>     const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://szmidtke.pl';
>     const updated = posts[0]?.data.date.toISOString() ?? new Date().toISOString();
>
>     const xml = `<?xml version="1.0" encoding="utf-8"?>
>   <feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pl">
>     <title>Marcin Szmidtke</title>
>     <subtitle>Piszę, żeby zauważyć, co robię, żeby nie myśleć.</subtitle>
>     <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml"/>
>     <link href="${siteUrl}/" rel="alternate" type="text/html"/>
>     <id>${siteUrl}/</id>
>     <updated>${updated}</updated>
>     <author><name>Marcin Szmidtke</name><email>kontakt@szmidtke.pl</email></author>
>     ${posts.slice(0, 20).map((p) => `
>     <entry>
>       <title>${escapeXml(p.data.title)}</title>
>       <link href="${siteUrl}/blog/${p.slug}" rel="alternate" type="text/html"/>
>       <id>${siteUrl}/blog/${p.slug}</id>
>       <updated>${p.data.date.toISOString()}</updated>
>       <published>${p.data.date.toISOString()}</published>
>       <summary type="text">${escapeXml(p.data.lead)}</summary>
>     </entry>`).join('')}
>   </feed>`;
>
>     return new Response(xml.trim(), {
>       headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
>     });
>   }
>
>   function escapeXml(s: string): string {
>     return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
>   }
>   ```
> - `BaseLayout.astro` — dodaj obok RSS link:
>   ```html
>   <link rel="alternate" type="application/atom+xml" title="szmidtke.pl — Atom" href="/atom.xml" />
>   ```
> - `SiteFooter.astro` — w kolumnie *Nawigacja* dodaj `<a href="/atom.xml">atom</a>` po `rss`.
>
> Commit: `iteration 23: nie-ja status widget + cleanup polishy`.

**Do zrobienia:**
- `src/components/NieJaStatus.astro` (5 etapów, props `current`).
- Update `src/pages/nie-ja.astro` — wstaw widget.
- `_archive-raw/README.md` (potwierdź gitignore).
- `PostFooter.astro` — `querySelectorAll` zamiast `querySelector`.
- `src/pages/atom.xml.ts` — Atom feed.
- Update `BaseLayout.astro` — `link rel="alternate" type="application/atom+xml"`.
- Update `SiteFooter.astro` — link `atom`.

**Gotowe kiedy:**
- `/nie-ja` pokazuje widget statusu na etapie `redakcja`.
- Zmiana propsu `current` na `korekta` → przesunięcie wizualne.
- `/atom.xml` waliduje się w czytniku (np. Reeder, NetNewsWire).
- PostFooter scoped (gdyby były 2 wpisy na stronie, oba mają działający kopiuj-link).
- `_archive-raw/README.md` opisuje, czemu folder jest i kiedy usuwać.

**Poza zakresem:**
- Animacje przejść etapów.
- Daty premiery / countdown.

---

## Sequencja i decyzje Marcina

**Decyzje (Marcin może po prostu zaakceptować defaulty):**

| # | Decyzja | Default |
|---|---------|---------|
| 19 | Web Vitals plugin Plausible | TAK |
| 20 | CSP — `unsafe-inline` w v1, refactor na nonce w Sprint 4 | TAK (kompromis) |
| 22 | Off-site backup (rclone) | NIE w Sprint 3, do dyskusji w Sprint 4 |
| 23 | Atom feed obok RSS | TAK |
| 23 | Etapy statusu *Nie ja* (`szkic → rękopis → redakcja → korekta → druk`) | TAK, chyba że Marcin chce inny podział |

**Sequencja:**
- 18, 19, 20, 22 — niezależne, dowolna kolejność.
- 21 (Lighthouse) — **na końcu**, żeby zmierzyć efekt 18-20 i 22.
- 23 — kiedy chcesz, równolegle do reszty.

**Total:** 6 sesji Claude Code, brak długich.
