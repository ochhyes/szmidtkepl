# Deploy — szmidtke.pl

Workflow: **dwa remote'y** — GitHub (`origin`) jako źródło prawdy i backup, VPS (`vps`) jako deploy target przez bare repo + post-receive hook.

---

## Jednorazowy setup

### 1. GitHub remote (źródło prawdy)

Repo: https://github.com/ochhyes/szmidtkepl (pust, do wypełnienia pierwszym pushem).

```bash
git remote add origin https://github.com/ochhyes/szmidtkepl.git
git push -u origin main
```

### 2. VPS — bare repo + hook

Zaloguj się na VPS (SSH).

```bash
# Jednorazowo — przygotuj miejsce
sudo mkdir -p /opt/szmidtke/app
sudo chown $USER:$USER /opt/szmidtke /opt/szmidtke/app

# Bare repo — to tutaj wchodzą pushy
git init --bare /opt/szmidtke.git

# .env na produkcji — wpisz prawdziwy BUTTONDOWN_API_KEY
cat > /opt/szmidtke/app/.env <<EOF
BUTTONDOWN_API_KEY=bd_xxx_prawdziwy_klucz35d40f52-b84e-4a31-a769-cfb7ce5a298d
PUBLIC_SITE_URL=https://szmidtke.pl
EOF
chmod 600 /opt/szmidtke/app/.env

# Post-receive hook — checkout + docker rebuild
cat > /opt/szmidtke.git/hooks/post-receive <<'EOF'
#!/usr/bin/env bash
set -e
WORK=/opt/szmidtke/app
GIT_DIR=/opt/szmidtke.git

echo "→ checkout main do $WORK"
git --work-tree="$WORK" --git-dir="$GIT_DIR" checkout -f main

cd "$WORK"
echo "→ docker compose build"
docker compose build

echo "→ docker compose up -d (zero-downtime replace)"
docker compose up -d

echo "✓ deploy done @ $(date -Iseconds)"
EOF
chmod +x /opt/szmidtke.git/hooks/post-receive
```

### 3. Remote `vps` lokalnie

Na swojej maszynie (tej, z której pushujesz):

```bash
git remote add vps ssh://USER@VPS_HOST/opt/szmidtke.git
# np. git remote add vps ssh://marcin@203.0.113.42/opt/szmidtke.git
git push vps main   # pierwszy deploy
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
# Jedno polecenie
./scripts/deploy.sh

# Albo ręcznie
git push origin main    # backup + GitHub
git push vps main       # deploy (post-receive hook robi resztę)
```

Hook na VPS wykonuje:
1. `git checkout -f main` do `/opt/szmidtke/app`
2. `docker compose build` — rebuild image
3. `docker compose up -d` — replace kontenera (zero-downtime jeśli healthcheck przechodzi)

Downtime typowo 1–3s (start nowej instancji + wymiana).

---

## Rollback

Jeśli deploy zepsuł produkcję:

```bash
# Znajdź poprzedni zielony commit
git log --oneline -10

# Force-push POPRZEDNIEGO commita na vps (NIE origin)
git push vps <sha-poprzedniego>:main -f
```

Po naprawie buga na main — zwykły `./scripts/deploy.sh` przywraca świeży stan.

**Uwaga:** `-f` tylko na `vps`, **nigdy** na `origin` (GitHub jest źródłem prawdy).

---

## Debug

```bash
# Logi aplikacji
ssh vps 'docker compose -f /opt/szmidtke/app/docker-compose.yml logs -f'

# Healthcheck
curl -I https://szmidtke.pl/

# Metryki kontenera
ssh vps 'docker stats szmidtkepl'

# Restart bez rebuild
ssh vps 'cd /opt/szmidtke/app && docker compose restart'
```

---

## Rzeczy do pilnowania

- **Backup `.env`** na VPS — nie jest w git, jeśli zniknie to klucz Buttondown przepadnie.
- **Certyfikat Certbot** renewuje się sam co 90 dni (cron). Warto sprawdzić `sudo certbot renew --dry-run` raz na kwartał.
- **Docker cleanup** — stare image narastają: `docker system prune -a --volumes` raz na miesiąc.
- **Bare repo po failed push** — jeśli hook padnie w trakcie builda, ręcznie `docker compose up -d` na VPS.

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
