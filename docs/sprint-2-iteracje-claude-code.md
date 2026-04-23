# Sprint 2 — iteracje dla Claude Code, szmidtke.pl

*Handoff dla Claude Code. Pełny audyt PM i uzasadnienia → `C:\Users\ochhy\OneDrive\Claude\szmidtke-pl-rebrand\sprint-2-plan.md`. Tu są tylko prompty, do-zrobienia, definition-of-done.*

**Wejście dla Claude Code (zawsze):**
- `docs/szmidtke-pl-ux-design-spec.md` — źródło prawdy designowej.
- `docs/szmidtke-pl-ux-final.html` — wzorzec wizualny.
- `docs/iteracje-claude-code.md` — Sprint 1 (zamknięty).
- `docs/sprint-2-iteracje-claude-code.md` — ten plik.

**Zasady:**
1. Każda iteracja = osobna sesja.
2. Commit na końcu każdej iteracji.
3. Raport końcowy 5-10 linii.
4. Niejasności → spytaj, nie improwizuj.
5. TypeScript strict, zero `any`.

---

## Iteracja 11 — Privacy microcopy + komunikat oczekiwania

**Cel:** Microcopy przy formularzu wskazuje na politykę. Komunikat sukcesu wzmacnia oczekiwanie na confirmation. Maile w Buttondown — Marcin pisze sam.

*Uwaga: część „copy 3 maili" wycięta — Marcin pisze własne i wkleja bezpośrednio w Buttondown panelu (Settings → Emails). Claude Code dotyka tylko kodu.*

**Prompt:**
> Iteracja 11 wg `docs/sprint-2-iteracje-claude-code.md`. Tylko kod, bez copy maili.
>
> - `src/components/NewsletterInline.astro` — pod formularzem (poza success state) microcopy: *„Zapisując się, akceptujesz [politykę prywatności](/prywatnosc). Wypisać się można jednym kliknięciem."*. Link do `/prywatnosc` aktywuje się dopiero w iter 12 — do tego czasu wskazuje na 404, OK.
> - `src/pages/api/subscribe.ts` — w success path (JSON i HTML fallback) komunikat: *„Pierwszy mail z linkiem do potwierdzenia powinien przyjść w ciągu kilku minut."*.
> - W JS handler `NewsletterInline` dodaj komentarz `// TODO iter 13: redirect na /zapisany po sukcesie`. Na razie zostaw text-only success.
>
> Commit: `iteration 11: privacy microcopy + signup expectation copy`.

**Do zrobienia:**
- Microcopy w `NewsletterInline.astro`.
- Update komunikatu sukcesu w `subscribe.ts`.
- Komentarz TODO o redirecie.

**Gotowe kiedy:**
- Microcopy widoczne pod formularzem (Home + Nie ja).
- Komunikat sukcesu w endpoincie wzmacnia oczekiwanie na confirmation.

**Poza zakresem:**
- Drafty maili Buttondown — Marcin robi sam.
- Strona `/prywatnosc` (iter 12).
- Strona `/zapisany` i redirect (iter 13).

---

## Iteracja 12 — Polityka prywatności

**Cel:** `/prywatnosc` zgodna z RODO art. 13, czytelna, w stylu strony. Linkowana w stopce.

**Prompt:**
> Iteracja 12 wg `docs/sprint-2-iteracje-claude-code.md`. Stwórz `src/pages/prywatnosc.astro` — `BaseLayout`, `container reading`, styl typograficzny jak `o-mnie` ale bez portretu. H1 *„Prywatność"*. Bez prawniczego boilerplate, pisane po ludzku.
>
> **Sekcje (draft, do akceptacji Marcina):**
> 1. *„Co tu zbieram"* — adres email z newslettera, nic poza tym. Zero analytics (lub *„z anonimowymi statystykami Plausible"* po iter 16). Zero cookies, zero trackerów.
> 2. *„Po co"* — newsletter co dwa tygodnie, nic więcej.
> 3. *„Kto przetwarza"* — Marcin Szmidtke (administrator) + Buttondown Inc. (processor, US, SCC). Link do polityki Buttondown.
> 4. *„Twoje prawa"* — wgląd, sprostowanie, usunięcie, sprzeciw, przenoszenie. Jak: `kontakt@szmidtke.pl` lub link „wypisz" w mailu.
> 5. *„Jak długo trzymam"* — do wypisania. Buttondown 30 dni suppression list, potem usuwa.
> 6. *„Zmiany polityki"* — info w newsletterze. Wersja + data na końcu strony.
> 7. *„Skarga"* — PUODO + link.
>
> Stopa: *„Wersja 1, 2026-04-XX. Pisane po ludzku."*
>
> Update `SiteFooter.astro` — w kolumnie *„O stronie"* dodaj `<a href="/prywatnosc">prywatność</a>` pod istniejącym tekstem.
>
> Commit: `iteration 12: privacy policy + footer link`.

**Do zrobienia:**
- `src/pages/prywatnosc.astro`.
- Update `SiteFooter.astro`.

**Gotowe kiedy:**
- `/prywatnosc` renderuje się, dark mode OK.
- Stopka linkuje do polityki.
- Microcopy z iter 11 prowadzi do żywej strony.

**Poza zakresem:**
- Cookie banner (zero cookies = zero bannera).

---

## Iteracja 13 — Kontakt + Zapisany

**Cel:** `/kontakt` z segmentacją intencji (mailto, bez formularza). `/zapisany` jako thank-you po subscribe. Redirect po sukcesie.

**Prompt:**
> Iteracja 13 wg `docs/sprint-2-iteracje-claude-code.md`. Dwie nowe strony + zmiana flow subscribe.
>
> **`src/pages/kontakt.astro`** — `BaseLayout`, `container reading`. H1 *„Napisz"*. Lead italic: *„Czytam wszystkie listy. Odpowiadam wolno, ale odpowiadam."*
>
> Sekcje (każda akapit + `mailto:` z `subject` prefilled):
> 1. *„Chcesz odpowiedzieć na list, dodać coś od siebie, sprostować"* → subject `Odpowiedź na list`.
> 2. *„Szukasz Fundacji Pomocja / wsparcia w roli ojca"* → subject `Pomocja`. Akapit: *„Napisz krótko, kim jesteś i czego potrzebujesz."* + link do `/pomocja` (aktywny po iter 14).
> 3. *„Jesteś dziennikarzem / podcastem / wydawcą"* → subject `Media`.
> 4. *„Czego nie obsługuję"* — opt-out segments: *„Nie sprzedaję szkoleń, nie prowadzę webinarów, nie robię konsultacji 1:1 (jeszcze)."*
>
> Stopa: link LinkedIn + `kontakt@szmidtke.pl` clickable.
>
> **`src/pages/zapisany.astro`** — `BaseLayout`, `container reading`, `<meta name="robots" content="noindex">`. H1 *„Zapisany."* (kropka). Lead italic *„Dziękuję."*
>
> Treść:
> - *„Za chwilę przyjdzie mail z linkiem. Kliknij, żeby potwierdzić."*
> - *„Jeśli nie dojdzie w ciągu pięciu minut — sprawdź spam."*
> - *„Pierwszy prawdziwy list dostaniesz [w najbliższy czwartek]. Krótszy niż teksty na stronie."*
> - *„Tymczasem — [najnowszy tekst](dynamiczny link)."*
> - Stopa: *„← wróć do strony"* + mailto *„napisz, jeśli nie dojdzie"*.
>
> Logika: `getPublishedPosts()` → najnowszy → link.
>
> **Update `NewsletterInline.astro`:**
> Aktywuj redirect (TODO z iter 11). W success handler:
> ```js
> if (data.ok) {
>   button.textContent = successText;
>   input.value = '';
>   input.disabled = true;
>   setTimeout(() => { window.location.href = '/zapisany'; }, 1500);
> }
> ```
>
> **Update `subscribe.ts`:**
> Dla form-encoded sukcesu zwróć `Response.redirect('/zapisany', 303)` zamiast HTML fallback. JSON path bez zmian. Error path bez zmian.
>
> **Update `SiteHeader.astro`:**
> Dodaj `{ href: '/kontakt', label: 'Kontakt' }` po *Newsletter*.
>
> **Update `SiteFooter.astro`:**
> `<a href="/kontakt">kontakt</a>` w kolumnie *Nawigacja* przed `rss`.
>
> Commit: `iteration 13: contact page + thank-you flow`.

**Do zrobienia:**
- `src/pages/kontakt.astro`.
- `src/pages/zapisany.astro` (z dynamicznym linkiem do najnowszego wpisu).
- Update `subscribe.ts` — 303 redirect dla form sukcesu.
- Update `NewsletterInline.astro` — JS redirect.
- Update `SiteHeader.astro` i `SiteFooter.astro`.

**Gotowe kiedy:**
- `/kontakt` renderuje się, mailto: linki otwierają klient maila z subject.
- `/zapisany` renderuje się, link do najnowszego wpisu działa.
- E2E subscribe (z JS i bez) → ląduje na `/zapisany`.
- Nav i stopka pokazują *Kontakt*.

**Poza zakresem:**
- Formularz na `/kontakt`.
- Strona `/wypisz` (Buttondown obsługuje).

---

## Iteracja 14 — Pomocja teaser

**Cel:** Krótki teaser z linkiem do pomocja.pl. Bez roztkliwiania się — Fundacja ma własną stronę, my tylko wskazujemy.

**Prompt:**
> Iteracja 14 wg `docs/sprint-2-iteracje-claude-code.md`. `src/pages/pomocja.astro` — krótki teaser, nie pełny landing.
>
> Layout: `BaseLayout`, `container reading` (680px), styl jak `o-mnie` ale bez portretu.
>
> Treść (zwięźle, 4-6 akapitów max):
> - **H1** *„Pomocja"*.
> - **Lead italic**: *„Fundacja, którą prowadzimy. Wsparcie dla mężczyzn w roli, której nikt nie szkoli."* (Marcin może doprecyzować — zostaw jako placeholder z markerem `[COPY: pomocja-lead]`.)
> - **Akapit 1** — 2-3 zdania o tym, czym jest Fundacja i dlaczego powstała. Marker `[COPY: pomocja-akapit-1]`.
> - **Akapit 2** — *„Cała robota dzieje się na [pomocja.pl](https://pomocja.pl). Tam są terminy spotkań, formularze zgłoszeniowe, opisy projektów. Tu zostawiam tylko ślad."*
> - **CTA inline** (nie button — zwykły link italic w stylu strony): *„→ pomocja.pl"* z `rel="noopener"` i `target="_blank"`.
> - **Stopka strony** (opcjonalnie, jeśli mamy odpowiednie wpisy): *„Pisałem o Fundacji"* + 2-3 linki do wpisów z kategorii `zespol` lub z tagiem `pomocja` (jeśli jakikolwiek wpis ma ten tag — jeśli nie, pomiń sekcję).
>
> Update `SiteHeader.astro` — **NIE dodawaj** Pomocji do nav głównego (Marcin wprost: bez roztkliwiania się). Pomocja żyje w stopce + linku w o-mnie.
> Update `SiteFooter.astro` — `<a href="/pomocja">pomocja</a>` w kolumnie *Nawigacja* po `nie ja`.
> Update `o-mnie.astro` — w akapicie o Fundacji wymień `Pomocja` na `<a href="/pomocja">Pomocja</a>`.
>
> Commit: `iteration 14: pomocja teaser`.

**Do zrobienia:**
- `src/pages/pomocja.astro` (krótki teaser).
- Update `SiteFooter.astro` — link w stopce.
- Update `o-mnie.astro` — link.

**Gotowe kiedy:**
- `/pomocja` renderuje się, link na pomocja.pl działa (otwiera w nowej karcie).
- Link w stopce + o-mnie prowadzi do `/pomocja`.
- Pomocja **NIE** jest w głównej nawigacji.

**Poza zakresem:**
- Pełny landing Fundacji (mieszka na pomocja.pl).
- Formularz zgłoszeniowy.
- Pomocja w głównym menu.

---

## Iteracja 15 — Blog UX polish

**Cel:** Tagi widoczne, prev/next, share, `/blog/spis`.

**Prompt:**
> Iteracja 15 wg `docs/sprint-2-iteracje-claude-code.md`. Cztery dopinki w blogu.
>
> **1. Tagi widoczne.**
> - Schemat `tags` już jest w `src/content/config.ts` — bez zmian.
> - `src/components/PostTags.astro` (props: `tags: string[]`) — renderuje pigułki (mały serif italic, hairline border, padding 2px 8px). Klik → `/blog/tag/[slug-tagu]`.
> - `PostCard.astro` (variant `list` i `home`) — pod meta italic dodaj `<PostTags tags={tags} />` jeśli `tags?.length`.
> - `src/pages/blog/[...slug].astro` — pod meta na pojedynczym wpisie ten sam komponent.
> - `src/pages/blog/tag/[tag].astro` z `getStaticPaths` (lista wszystkich tagów z published posts). Layout jak `/blog/kategoria/[nazwa].astro`.
>
> **2. Prev/next.**
> - W `src/utils/posts.ts` — `getAdjacentPosts(currentSlug, allPosts)` zwraca `{ prev, next }` chronologicznie (date desc → next jest nowsze).
> - `PostFooter.astro` — pod *„zobacz też"* `<nav class="prev-next">` z dwoma linkami. Mobile stack, desktop dwukolumnowy grid (`← poprzedni` / `następny →`).
>
> **3. Share.**
> - `PostFooter.astro` — sekcja *„udostępnij"* z dwoma buttonami:
>   - **Kopiuj link** — `navigator.clipboard.writeText(window.location.href)`, po sukcesie tekst *„skopiowano"* na 2s.
>   - **LinkedIn** — `<a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener">linkedin →</a>`.
> - Bez Twittera, bez Facebooka.
>
> **4. `/blog/spis`.**
> - `src/pages/blog/spis.astro` — `BaseLayout`, `container reading`. H1 *„Spis"*, lead italic *„Wszystko po kolei. Od najnowszego."*
> - `<dl>`: `<dt>` rok, `<dd>` lista wpisów (data + tytuł jako link). Bez kategorii/filtrowania.
> - `SiteFooter.astro` — link `spis` po `piszę`.
> - `/blog/index.astro` — w nagłówku obok subtitle italic link `wszystkie teksty po kolei →` do `/blog/spis`.
>
> Commit: `iteration 15: blog UX polish — tags, prev/next, share, archive`.

**Do zrobienia:**
- `src/components/PostTags.astro`.
- Update `PostCard.astro` i `[...slug].astro`.
- `src/pages/blog/tag/[tag].astro`.
- `src/utils/posts.ts` — `getAdjacentPosts()`.
- Update `PostFooter.astro` — prev/next + share.
- `src/pages/blog/spis.astro`.
- Update `SiteFooter.astro` i `/blog/index.astro`.

**Gotowe kiedy:**
- Tagi na karcie i na pojedynczym. Strona tagu działa.
- Prev/next + share w stopce wpisu. Kopiuj-link działa.
- `/blog/spis` grupuje po roku.

**Poza zakresem:**
- Search (Pagefind można dodać później).
- Tagi z opisami.

---

## Iteracja 16 — Plausible self-hosted + 404 + favicon

**Cel:** Self-hosted Plausible w Dockerze (zero kosztów, zero cookies). 404 z linkami. Favicon SVG.

**Prompt:**
> Iteracja 16 wg `docs/sprint-2-iteracje-claude-code.md`. Trzy dopinki.
>
> **1. Plausible self-hosted (Docker).**
> - `docker-compose.yml` — dodaj serwisy `plausible` (`ghcr.io/plausible/community-edition:latest`), `plausible_db` (`postgres:16-alpine`), `plausible_events_db` (`clickhouse/clickhouse-server:24-alpine`) wg official self-host docs (`https://github.com/plausible/community-edition`).
> - Sieć: nowy `plausible_net` dla trzech serwisów Plausible. Główny serwis `web` (Astro app) zostaje na swojej sieci — Plausible jest niezależnym stackiem.
> - Volumes: `plausible_db_data`, `plausible_events_data`, `plausible_data` (persistent).
> - `.env.example` — dodaj sekcję Plausible:
>   ```
>   # Plausible analytics (iter 16) — self-hosted
>   PUBLIC_PLAUSIBLE_DOMAIN=szmidtke.pl
>   PLAUSIBLE_SECRET_KEY_BASE=  # wygeneruj: openssl rand -base64 64
>   PLAUSIBLE_TOTP_VAULT_KEY=    # wygeneruj: openssl rand -base64 32
>   ```
> - `nginx.conf.example` — dodaj przykładowy blok dla `analytics.szmidtke.pl` → `proxy_pass http://127.0.0.1:8000;` (Plausible domyślnie nasłuchuje na 8000).
> - `BaseLayout.astro` — warunkowy script: jeśli `import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN` ustawiony, render `<script defer data-domain={domain} src="https://analytics.szmidtke.pl/js/script.js"></script>` w `<head>` (po preconnect, przed głównymi stylami). Inaczej nic.
> - `prywatnosc.astro` (z iter 12) — sekcja *„Co tu zbieram"* zaktualizuj: dodaj zdanie *„Anonimowe statystyki odwiedzin (Plausible, hostowane na własnym serwerze, bez cookies, bez fingerprintu, bez przekazywania danych komukolwiek)."*.
> - `DEPLOY.md` — dodaj sekcję *„Plausible — pierwszy setup"*: jak wygenerować klucze, jak utworzyć użytkownika admin po pierwszym starcie kontenera, jak dodać DNS dla `analytics.szmidtke.pl`, jak Certbot obsługuje subdomenę.
>
> **2. 404 polish.**
> - `src/pages/404.astro` — pod istniejącym literackim tekstem dodaj sekcję: 3 ostatnie wpisy (`PostCard variant="list"`) + link do `/blog/spis`. Tekst łączący italic: *„Skoro już tu jesteś — może coś z tego."*
>
> **3. Favicon SVG.**
> - `public/favicon.svg` — minimalistyczny inicjał „M" w serif (Newsreader fallback Georgia). 32×32 viewBox. Burgundy `#6B2E2E` na `#FAF8F3`. Letter spacing minimalne, weight 500.
> - `BaseLayout.astro` — `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` w `<head>`. Zostaw istniejący `favicon.ico` jako fallback dla starszych przeglądarek (jeśli jest).
>
> Commit: `iteration 16: plausible self-hosted + 404 polish + svg favicon`.

**Do zrobienia:**
- Plausible (3 serwisy + sieć + volumes) w `docker-compose.yml`.
- Update `nginx.conf.example` — blok `analytics.szmidtke.pl`.
- Update `BaseLayout.astro` — warunkowy script Plausible + link favicon.
- Update `.env.example` — sekcja Plausible.
- Update `prywatnosc.astro` — wzmianka o Plausible.
- Update `DEPLOY.md` — pierwszy setup Plausible.
- Update `404.astro` — 3 ostatnie wpisy + link do spisu.
- `public/favicon.svg`.

**Gotowe kiedy:**
- Po deploy `analytics.szmidtke.pl` pokazuje login dashboard Plausible.
- Po pierwszym założeniu konta + dodaniu site `szmidtke.pl` w panelu, wizyty na szmidtke.pl pojawiają się w dashboardzie.
- 404 pokazuje 3 ostatnie wpisy + link do spisu.
- Favicon SVG widoczny w tabie przeglądarki.

**Poza zakresem:**
- Plausible goale (newsletter signup track) — opcjonalnie kiedyś.
- Touch icons / PWA manifest.
- Setup automatyczny pierwszego użytkownika (Marcin robi raz przez UI).

---

## Iteracja 17 — Migracja archiwum

*Identyczna z iter 9 z `docs/iteracje-claude-code.md`. Wymaga materiałów Marcina (`_archive-raw/`).*

**Prompt:**
> Iteracja 17 wg `docs/sprint-2-iteracje-claude-code.md`. Treść identyczna z iter 9 z `docs/iteracje-claude-code.md` — przenieś bez zmian.

---

## Sequencja i decyzje Marcina

**Decyzje już podjęte (2026-04-23):**
- iter 14 → wariant teaser (link na pomocja.pl, bez roztkliwiania, **bez** Pomocji w głównym nav)
- iter 16 → Plausible self-hosted w Dockerze (zero kosztów)
- *„Wersje" wykreślone z planu* — to teraz jest *„Nie ja"*, strona już istnieje

| Przed | Decyzja / wkład Marcina |
|-------|--------------------------|
| 11 | Marcin sam pisze 3 maile do Buttondown (Claude Code może podać szablon, ale Marcin zrobił już własne) |
| 12 | Akceptacja treści polityki |
| 13 | Akceptacja copy Kontakt; mała decyzja o segmencie *„Doradztwo"* (opt-in czy opt-out) |
| 14 | Akceptacja krótkiego copy teasera Pomocji (lead + 2 akapity) |
| 15 | Nic |
| 16 | Wygenerowanie kluczy Plausible (`openssl rand`), DNS dla `analytics.szmidtke.pl`, założenie pierwszego konta admin po starcie kontenera |
| 17 | Pliki archiwum (`_archive-raw/`) |

**Realna ścieżka P0:** 11 → 12 → 13 (sztywno sekwencyjnie).
**Potem:** 14 i 15 mogą iść równolegle (różne pliki, brak konfliktów).
**Na końcu:** 16 + 17 (17 czeka na materiały Marcina).

Total 6-7 sesji Claude Code.
