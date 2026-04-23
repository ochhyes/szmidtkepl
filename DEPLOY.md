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

# Na VPS — nginx reverse proxy
sudo cp /opt/szmidtke/app/nginx.conf.example /etc/nginx/sites-available/szmidtke.pl
sudo ln -s /etc/nginx/sites-available/szmidtke.pl /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL via Certbot
sudo certbot --nginx -d szmidtke.pl -d www.szmidtke.pl
```

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

Flaga `PUBLIC_PLAUSIBLE_DOMAIN` jest inline'owana przez Astro w czasie budowania, więc po
pierwszym ustawieniu w `.env` trzeba wymusić rebuild:

```bash
cd /opt/szmidtke/app
docker compose build web
docker compose up -d web
```

### Uwaga na zasoby

ClickHouse + Postgres + Elixir app razem biorą ~1-1.5 GB RAM i jeden rdzeń dość często.
Na bardzo małym VPS (1GB RAM) może trzeszczeć przy dużych ruchach.

---

## Alternatywa: GitHub Actions (później)

Po ustabilizowaniu workflow można dorzucić `.github/workflows/deploy.yml`, który:
1. Uruchamia się na push do main.
2. SSH-uje się na VPS i triggeruje `git --work-tree=... pull && docker compose up -d`.

Zalety: jeden push zamiast dwóch, logi deploya w GitHub Actions, możliwość testów CI przed deployem.  
Wady: wymaga sekretu `DEPLOY_SSH_KEY` w repo, nieco więcej konfiguracji.

Na razie — prosty model z dwoma remote'ami wystarczy.
