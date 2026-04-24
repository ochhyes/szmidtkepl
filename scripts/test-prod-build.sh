#!/usr/bin/env bash
# =============================================================================
# Smoke test produkcyjnego builda — 1:1 jak w Dockerze, ale lokalnie.
# Odpalaj PRZED ./scripts/deploy.sh — wyłapuje regresje, zanim trafią na VPS.
# Bash (Git Bash / WSL / Linux / macOS).
# =============================================================================
set -euo pipefail

PORT="${PORT:-4322}"   # 4322 żeby nie kolidował z dev serverem na 4321
HOST="${HOST:-127.0.0.1}"
ROUTES=(
  "/"
  "/blog"
  "/blog/spis"
  "/o-mnie"
  "/nie-ja"
  "/pomocja"
  "/kontakt"
  "/prywatnosc"
  "/zapisany"
  "/404.html"
  "/rss.xml"
  "/atom.xml"
  "/sitemap-index.xml"
  "/sitemap-0.xml"
  "/favicon.svg"
  "/og-default.png"
)

echo "→ astro check + astro build"
npm run build

echo "→ start node ./dist/server/entry.mjs na ${HOST}:${PORT}"
HOST="$HOST" PORT="$PORT" node ./dist/server/entry.mjs &
SRV=$!
trap "kill $SRV 2>/dev/null || true" EXIT

# Poczekaj aż serwer się obudzi (max 15s).
for i in $(seq 1 30); do
  if curl -sf -o /dev/null -m 1 "http://${HOST}:${PORT}/"; then break; fi
  sleep 0.5
done

FAIL=0
for route in "${ROUTES[@]}"; do
  # -D zbiera nagłówki, -o body — sprawdzamy że status == 200 ORAZ body nie jest puste.
  # Samo 200 nie wystarczy — nginx z wadliwym proxy też może zwrócić 200 z pustym body,
  # a nasza regresja 403 Sprint 3 pokazuje że status sam nie reprezentuje zdrowia.
  body_file=$(mktemp)
  code=$(curl -s -o "$body_file" -w "%{http_code}" -m 5 "http://${HOST}:${PORT}${route}")
  size=$(wc -c < "$body_file")
  expected=200
  # /404.html sam w sobie zwraca 200 z bundle statycznego, ale jeśli kiedyś zniknie
  # i serwer zrobi fallback na /nieistniejace → 404. Sprawdzamy i tak 200.
  if [ "$code" = "$expected" ] && [ "$size" -gt 100 ]; then
    printf "  [OK  %s %db] %s\n" "$code" "$size" "$route"
  else
    printf "  [FAIL %s %db] %s (expected %s + non-empty body)\n" "$code" "$size" "$route" "$expected"
    FAIL=$((FAIL+1))
  fi
  rm -f "$body_file"
done

# Plausible inline — budując z PUBLIC_PLAUSIBLE_DOMAIN=<wartość> HTML musi zawierać
# `data-domain="..."`. Gdy zmienna jest pusta — tagu być NIE MOŻE.
# Historyczna regresja: .dockerignore wykluczał .env → build dostawał undefined →
# tracker nie ładował się na proda nigdy. Fix: build-arg w Dockerfile + docker-compose.
root_html=$(curl -s -m 5 "http://${HOST}:${PORT}/")
if [ -n "${PUBLIC_PLAUSIBLE_DOMAIN:-}" ]; then
  if echo "$root_html" | grep -qi "data-domain=\"${PUBLIC_PLAUSIBLE_DOMAIN}\""; then
    printf "  [OK  plausible] data-domain=\"%s\" obecny w HTML\n" "$PUBLIC_PLAUSIBLE_DOMAIN"
  else
    printf "  [FAIL plausible] PUBLIC_PLAUSIBLE_DOMAIN=%s ale tag nie w HTML — build-time env nie dotarł\n" "$PUBLIC_PLAUSIBLE_DOMAIN"
    FAIL=$((FAIL+1))
  fi
else
  if echo "$root_html" | grep -qi 'plausible'; then
    printf "  [FAIL plausible] brak PUBLIC_PLAUSIBLE_DOMAIN, ale tag obecny w HTML\n"
    FAIL=$((FAIL+1))
  else
    printf "  [OK  plausible] brak env, brak tagu (poprawnie)\n"
  fi
fi

# Dodatkowo: POST /api/subscribe z pustym kluczem — w NODE_ENV=production powinno
# zwrócić 500 (server_misconfigured), bo .env lokalnie nie ma klucza Buttondown.
# W dev byłby 200 (fallback). Tutaj testujemy prod build, więc 500 == OK flow.
node_env_code=$(NODE_ENV=production curl -s -o /dev/null -w "%{http_code}" -m 5 \
  -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com"}' \
  "http://${HOST}:${PORT}/api/subscribe")
printf "  [subscribe POST] HTTP %s (500=brak klucza OK, 200=klucz był)\n" "$node_env_code"

# Oczekiwany 404 dla nieistniejącej ścieżki — wychwytuje fallback do katalogu.
not_found=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "http://${HOST}:${PORT}/na-pewno-nie-istnieje-$$")
if [ "$not_found" = "404" ]; then
  printf "  [OK  404] /na-pewno-nie-istnieje → 404\n"
else
  printf "  [FAIL %s] /na-pewno-nie-istnieje → oczekiwałem 404\n" "$not_found"
  FAIL=$((FAIL+1))
fi

if [ $FAIL -eq 0 ]; then
  echo "✓ prod smoke OK"
  exit 0
else
  echo "✗ prod smoke: $FAIL błędów"
  exit 1
fi
