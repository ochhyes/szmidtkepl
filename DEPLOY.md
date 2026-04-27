# Deploy — szmidtke.pl

Workflow: **GitHub (`origin`) jako źródło prawdy**. VPS pulla z GitHuba i robi rebuild kontenera. Lokalnie odpalasz `./scripts/deploy.sh` — to robi push + SSH-uje do VPS i triggeruje pull + rebuild jednym ruchem.

---

## Jednorazowy setup

### 1. GitHub remote

```bash
git remote add origin https://github.com/ochhyes/szmidtkepl.git
git push -u origin main
```

### 2. VPS — clone + .env + Docker

Zaloguj się na VPS jako `ubuntu`.

```bash
# Przygotuj miejsce
sudo mkdir -p /opt/szmidtke
sudo chown -R ubuntu:ubuntu /opt/szmidtke

# Clone z GitHuba (repo jest public — bez auth)
cd /opt/szmidtke
git clone https://github.com/ochhyes/szmidtkepl.git app

# .env na produkcji — wklej PRAWDZIWY klucz Buttondown z https://buttondown.com/settings/programming
cat > /opt/szmidtke/app/.env <<EOF
BUTTONDOWN_API_KEY=<wklej-tutaj-klucz-z-buttondown>
PUBLIC_SITE_URL=https://szmidtke.pl
EOF
chmod 600 /opt/szmidtke/app/.env

# Pierwszy build + start
cd /opt/szmidtke/app
docker compose up -d --build

# Sprawdź że odpowiada
curl -sI http://127.0.0.1:3000 | head -1   # → HTTP/1.1 200 OK
```

### 3. SSH klucz do VPS dla deploy.sh

`./scripts/deploy.sh` SSH-uje się do VPS jako `ubuntu`. Test:

```bash
ssh ubuntu@VPS_IP "whoami"
# Powinno zwrócić: ubuntu (bez pytania o hasło)
```

Jeśli pyta o hasło — dodaj swój klucz do `~/.ssh/authorized_keys` na VPS. Z PowerShella:

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh ubuntu@VPS_IP "cat >> ~/.ssh/authorized_keys"
```

### 4. DNS + SSL

```bash
# DNS — u dostawcy domeny wskaż rekord A szmidtke.pl -> IP VPS
# (i www.szmidtke.pl → ten sam IP, lub CNAME → szmidtke.pl)

# 1. SSL — pobierz certy PRZED kopiowaniem configu (certonly nie rusza nginx).
#    --nginx modyfikuje config i rozbija idempotentność — nie używaj tu.
sudo certbot certonly --nginx -d szmidtke.pl
sudo certbot certonly --nginx -d www.szmidtke.pl
sudo certbot certonly --nginx -d analytics.szmidtke.pl

# 2. Wgraj referencyjny config (zawiera bloki 443 z gotowymi ścieżkami certów).
sudo cp /opt/szmidtke/app/nginx.conf.example /etc/nginx/sites-available/szmidtke.pl
sudo ln -s /etc/nginx/sites-available/szmidtke.pl /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**UWAGA — regresja Sprint 3 iter 20 (udokumentowana):** nie uruchamiaj `sudo certbot --nginx -d …`
po skopiowaniu configu. `--nginx` próbuje dokleić własne bloki 443/redirecty, zostawia
zmiany poza `nginx.conf.example` i następny `cp` wywala je. Zbliżył to właśnie 403 na
produkcji — apex `szmidtke.pl` stracił blok 443, request wpadał do default servera
(`claude.szmidtke.pl`) i dostawał 403 z `/var/www/ai-agent/`. Używamy `certbot certonly`
do pobrania certów i nginx.conf.example jako źródła prawdy konfiguracyjnej. Renewal
(`certbot renew` cron/timer) nie rusza configu — bezpieczny.

---

## Security headers — pierwsza weryfikacja (iteracja 20)

Po deploy zmian z iteracji 20 sprawdź nagłówki i redirect.

```bash
# 6 nagłówków security (HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy, CSP)
curl -I https://szmidtke.pl | grep -Ei "(strict-transport|x-content|x-frame|referrer-policy|permissions-policy|content-security)"

# www → non-www 301
curl -I https://www.szmidtke.pl/blog/pasywnosc-ktora-wyglada-jak-odpoczynek
# oczekiwane: HTTP/2 301, Location: https://szmidtke.pl/blog/pasywnosc-ktora-wyglada-jak-odpoczynek
```

Zewnętrzna weryfikacja:

- **Mozilla Observatory** — https://observatory.mozilla.org/analyze/szmidtke.pl — cel: **A** lub wyżej.
- **SecurityHeaders.com** — https://securityheaders.com/?q=szmidtke.pl — cel: **A**.

Jeśli CSP blokuje legalny zasób (konsola: *„Refused to load…"*), poszerz odpowiednią dyrektywę (`script-src`, `connect-src`, `img-src`, …) w bloku głównym `nginx.conf`. Po zmianie `sudo nginx -t && sudo systemctl reload nginx`.

**Wymagane przed deploy iter 20:** `sudo certbot --nginx -d www.szmidtke.pl` dokleja ssl_certificate do bloku redirectu 443. Bez tego pierwszy request po `https://www.szmidtke.pl` leci na cert apex i przeglądarka pokaże błąd zanim dostanie 301.

---

## Codzienny deploy

```bash
# Jedno polecenie — push GitHub + pull/rebuild na VPS + smoke test
./scripts/deploy.sh

# Albo ręcznie, dwa kroki:
git push origin main
ssh ubuntu@VPS_IP "cd /opt/szmidtke/app && git pull && docker compose up -d --build"
```

`scripts/deploy.sh` na końcu robi `curl https://szmidtke.pl` i zwraca błąd, jeśli HTTP nie jest 200 — od razu wiesz, że deploy padł.

Downtime typowo 1–3s (start nowej instancji + wymiana — Docker ma `restart: unless-stopped` i healthcheck).

Konfiguracja przez ENV jeśli IP albo ścieżka inne niż domyślne:

```bash
VPS_HOST=ubuntu@1.2.3.4 VPS_PATH=/opt/szmidtke/app ./scripts/deploy.sh
```

---

## Rollback

Jeśli deploy zepsuł produkcję — przywróć poprzedni commit na VPS bez ruszania GitHuba:

```bash
# Znajdź poprzedni zielony commit
git log --oneline -10

# Na VPS: checkout konkretnego SHA + rebuild
ssh ubuntu@VPS_IP "cd /opt/szmidtke/app && git checkout <sha-poprzedniego> && docker compose up -d --build"
```

Po naprawie buga na main — `./scripts/deploy.sh` zaktualizuje VPS do main z powrotem (`git pull` zignoruje detached HEAD i pójdzie na `origin/main`).

**Alternatywa** — revert na GitHubie + redeploy:

```bash
git revert <sha-zepsutego-commita>
./scripts/deploy.sh
```

Cleaner historia, GitHub jest spójny z VPS.

---

## Debug

```bash
# Logi aplikacji
ssh ubuntu@VPS_IP "cd /opt/szmidtke/app && docker compose logs -f web"

# Healthcheck
curl -I https://szmidtke.pl/

# Metryki kontenera
ssh ubuntu@VPS_IP "docker stats szmidtkepl"

# Restart bez rebuild (np. po zmianie .env)
ssh ubuntu@VPS_IP "cd /opt/szmidtke/app && docker compose down && docker compose up -d"
```

---

## Rzeczy do pilnowania

- **Backup `.env`** na VPS — nie jest w git, jeśli zniknie to klucz Buttondown przepadnie.
- **Certyfikat Certbot** renewuje się sam co 90 dni (cron). Warto sprawdzić `sudo certbot renew --dry-run` raz na kwartał.
- **Docker cleanup** — stare image narastają: `docker system prune -a --volumes` raz na miesiąc.
- **Failed deploy** — jeśli `./scripts/deploy.sh` przerwie się w trakcie builda, zaloguj się na VPS, sprawdź `docker compose logs web --tail=50`, napraw, ręcznie `docker compose up -d --build`.

---

## Plausible — pierwszy setup (iteracja 16)

Self-hosted analytics mieszka obok aplikacji w tym samym `docker-compose.yml`.
Trzy serwisy (`plausible`, `plausible_db`, `plausible_events_db`) + własna sieć `plausible_net`.
Wejście: `analytics.szmidtke.pl` → nginx → 127.0.0.1:8000.

### 1. Wygeneruj sekrety

Na VPS, raz:

```bash
# dokleja zmienne do .env — potem je sprawdź i edytuj
cat >> /opt/szmidtke/app/.env <<EOF

# Plausible — iteracja 16
PUBLIC_PLAUSIBLE_DOMAIN=szmidtke.pl
PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
PLAUSIBLE_TOTP_VAULT_KEY=$(openssl rand -base64 32 | tr -d '\n')
PLAUSIBLE_POSTGRES_PASSWORD=$(openssl rand -hex 24)
EOF
chmod 600 /opt/szmidtke/app/.env
```

### 2. DNS + SSL

```bash
# DNS — rekord A analytics.szmidtke.pl → IP VPS (ten sam, co szmidtke.pl)
# Po propagacji (~kilka minut):
sudo cp /opt/szmidtke/app/nginx.conf.example /etc/nginx/sites-available/szmidtke.pl
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d analytics.szmidtke.pl
```

### 3. Start kontenerów

```bash
cd /opt/szmidtke/app
docker compose up -d plausible_db plausible_events_db
# Poczekaj ~30s aż oba healthchecki pójdą zielone:
docker compose ps
docker compose up -d plausible
docker compose logs -f plausible   # zobaczysz migracje → "Plausible is ready"
```

### 4. Pierwszy użytkownik admin

Po starcie `plausible` wejdź na https://analytics.szmidtke.pl — rejestracja jest wyłączona
(`DISABLE_REGISTRATION=true`), więc trzeba utworzyć admina z linii poleceń:

```bash
docker compose exec plausible /entrypoint.sh db create-admin-user \
  admin@szmidtke.pl '<hasło>' 'Marcin Szmidtke'
```

Zaloguj się, dodaj site `szmidtke.pl` w UI, potwierdź. Tracker na szmidtke.pl zaczyna
liczyć wizyty od razu (skrypt jest ładowany warunkowo, gdy `PUBLIC_PLAUSIBLE_DOMAIN` jest
ustawiony w .env — po deploy strony z tym flagą).

### 5. Redeploy strony z trackerem

Flaga `PUBLIC_PLAUSIBLE_DOMAIN` jest inline'owana przez Astro w czasie budowania.
Przechodzi przez `build.args` w `docker-compose.yml` → `ARG` w `Dockerfile` → `ENV`
w build stage → `import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN` w Astro. `.env` jest w
`.dockerignore` (sekrety runtime nie lądują w warstwach obrazu), ale docker compose
czyta `.env` z katalogu projektu i interpoluje `${PUBLIC_PLAUSIBLE_DOMAIN}` do build-argów.

Po pierwszym ustawieniu w `.env` trzeba wymusić rebuild:

```bash
cd /opt/szmidtke/app
docker compose build web   # --no-cache jeśli rebuild nie łapie zmiany ARG
docker compose up -d web
```

Weryfikacja po deploy (powinno zwrócić jedną linię ze `<script ... data-domain="szmidtke.pl"`):

```bash
curl -s https://szmidtke.pl/ | grep -i 'data-domain'
```

### Uwaga na zasoby

ClickHouse + Postgres + Elixir app razem biorą ~1-1.5 GB RAM i jeden rdzeń dość często.
Na bardzo małym VPS (1GB RAM) może trzeszczeć przy dużych ruchach.

---

## Backup Plausible (iteracja 22)

Daily backup: Postgres (`pg_dump`) + ClickHouse (`events` + `sessions` jako gzipped TSV). Retention 14 dni, lokalnie w `/opt/backups/plausible/`. Skrypt: `scripts/backup-plausible.sh` (w repo).

### Setup cron

```bash
# Na VPS:
crontab -e
# Dopisz linię:
0 4 * * * /opt/szmidtke/app/scripts/backup-plausible.sh >> /var/log/plausible-backup.log 2>&1

# Pierwsze ręczne uruchomienie żeby sprawdzić czy działa:
bash /opt/szmidtke/app/scripts/backup-plausible.sh
ls -la /opt/backups/plausible/
# oczekiwane: pg-YYYY-MM-DD.sql.gz + ch-events-YYYY-MM-DD.tsv.gz + ch-sessions-YYYY-MM-DD.tsv.gz
```

### Restore

Postgres:

```bash
gunzip < /opt/backups/plausible/pg-2026-04-23.sql.gz \
  | docker compose -f /opt/szmidtke/app/docker-compose.yml exec -T plausible_db psql -U postgres plausible_db
```

ClickHouse (events; sessions analogicznie):

```bash
gunzip < /opt/backups/plausible/ch-events-2026-04-23.tsv.gz \
  | docker compose -f /opt/szmidtke/app/docker-compose.yml exec -T plausible_events_db \
    clickhouse-client --query "INSERT INTO plausible_events_db.events FORMAT TabSeparatedWithNames"
```

### Test odzyskania (rekomendowany raz po setupie)

1. Zrób ręczny backup (`bash scripts/backup-plausible.sh`).
2. Postaw drugi VPS testowy (lub docker compose stack lokalnie) z czystym Plausible.
3. Restore wg komend wyżej.
4. Zaloguj się do panelu testowego — sprawdź, czy site `szmidtke.pl` jest widoczny z historią wizyt.

### Off-site backup

**Out of scope Sprint 3 — rekomendacja:** dodać `rclone` do S3 / Backblaze B2 raz na dobę po lokalnym backupie. Pojedyncza awaria dysku VPS = utrata statystyk. Do rozważenia w Sprint 4.

---

## Alternatywa: GitHub Actions (później)

Po ustabilizowaniu workflow można dorzucić `.github/workflows/deploy.yml`, który:
1. Uruchamia się na push do main.
2. SSH-uje się na VPS i triggeruje `git --work-tree=... pull && docker compose up -d`.

Zalety: jeden push zamiast dwóch, logi deploya w GitHub Actions, możliwość testów CI przed deployem.  
Wady: wymaga sekretu `DEPLOY_SSH_KEY` w repo, nieco więcej konfiguracji.

Na razie — prosty model z dwoma remote'ami wystarczy.
