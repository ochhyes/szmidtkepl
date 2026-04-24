#!/usr/bin/env bash
# =============================================================================
# Smoke test LIVE — hituje publiczny szmidtke.pl tak, jak zobaczy użytkownik
# (przez DNS → Cloudflare? → nginx → docker). Lokalny test-prod-build.sh testuje
# tylko Dockera na 127.0.0.1, więc nie złapie warstwy 403: nginx / cert /
# Cloudflare / iptables. Ten skrypt tę lukę zamyka — odpal po każdym deploy.
#
# Exit 0 gdy wszystko zielone. Exit 1 przy pierwszym błędzie (szybki sygnał
# dla ./scripts/deploy.sh żeby zablokować pochopny push następnej zmiany).
# =============================================================================
set -uo pipefail

BASE="${BASE_URL:-https://szmidtke.pl}"
WWW="${WWW_URL:-https://www.szmidtke.pl}"
ROUTES=(
  "/"
  "/blog"
  "/blog/spis"
  "/o-mnie"
  "/nie-ja"
  "/pomocja"
  "/kontakt"
  "/prywatnosc"
  "/rss.xml"
  "/sitemap-index.xml"
)

FAIL=0

check() {
  local url="$1" expect="$2" label="$3" body_contains="${4:-}"
  local body; body=$(mktemp)
  local code; code=$(curl -sS -L -o "$body" -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "000")
  local size; size=$(wc -c < "$body")
  if [ "$code" != "$expect" ]; then
    printf "  [FAIL %s %db] %s → %s (expected %s)\n" "$code" "$size" "$label" "$url" "$expect"
    FAIL=$((FAIL+1))
  elif [ -n "$body_contains" ] && ! grep -qi "$body_contains" "$body"; then
    printf "  [FAIL content] %s → %s (brak '%s' w body)\n" "$label" "$url" "$body_contains"
    FAIL=$((FAIL+1))
  else
    printf "  [OK  %s %db] %s\n" "$code" "$size" "$label"
  fi
  rm -f "$body"
}

check_redirect() {
  local url="$1" expect_location_prefix="$2" label="$3"
  local loc; loc=$(curl -sSI -m 10 "$url" 2>/dev/null | awk 'tolower($1)=="location:"{print $2}' | tr -d '\r\n')
  local code; code=$(curl -sS -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "000")
  case "$loc" in
    "$expect_location_prefix"*)
      printf "  [OK  %s] %s → %s\n" "$code" "$label" "$loc"
      ;;
    *)
      printf "  [FAIL %s] %s → Location='%s' (expected prefix %s)\n" "$code" "$label" "$loc" "$expect_location_prefix"
      FAIL=$((FAIL+1))
      ;;
  esac
}

echo "→ live smoke vs ${BASE}"

for route in "${ROUTES[@]}"; do
  check "${BASE}${route}" "200" "GET ${route}"
done

# Sanity — odpowiedź ma wyglądać jak HTML Astro, nie jak strona „Welcome to nginx"
# ani maintenance. Tytuł strony głównej jest stabilny: szukamy "Marcin Szmidtke".
check "${BASE}/" "200" "home zawiera tytuł" "Marcin Szmidtke"

# 404 ma być 404, nie fallback 200 ze stroną główną (byłby duplicate content +
# absurdalne sitemapy w cache).
check "${BASE}/na-pewno-nie-istnieje-$$" "404" "404 na nieistniejącej trasie"

# www → non-www 301 (iter 20) — regresja wskaźnikowa dla złego konfigu nginx.
check_redirect "${WWW}/" "https://szmidtke.pl/" "www→non-www 301"

# Security headers (iter 20). Walidacja KONKRETNYCH wartości, nie samej obecności —
# regresja 403 Sprint 3 pokazała że inny server block (np. claude.szmidtke.pl)
# może mieć HSTS/XFO ustawione, ale z innymi wartościami. Presence test by przeszedł,
# request w rzeczywistości nie trafiałby do naszej aplikacji.
headers=$(curl -sSI -m 10 "${BASE}/" 2>/dev/null)
assert_header() {
  local name="$1" expected_substring="$2"
  local line; line=$(echo "$headers" | grep -i "^${name}:" | tr -d '\r')
  if [ -z "$line" ]; then
    printf "  [FAIL header] brak '%s'\n" "$name"
    FAIL=$((FAIL+1))
  elif ! echo "$line" | grep -qi "$expected_substring"; then
    printf "  [FAIL header] '%s' obecny, ale nie zawiera '%s' — obcy server block?\n    %s\n" "$name" "$expected_substring" "$line"
    FAIL=$((FAIL+1))
  else
    printf "  [OK  header] %s zawiera '%s'\n" "$name" "$expected_substring"
  fi
}
# max-age=63072000 (2 lata) + preload to nasz konkretny HSTS z nginx.conf.example.
# claude.szmidtke.pl ma max-age=31536000 bez preload — tego nie zaakceptujemy.
assert_header "strict-transport-security" "max-age=63072000"
assert_header "x-frame-options" "DENY"
assert_header "x-content-type-options" "nosniff"
assert_header "referrer-policy" "strict-origin-when-cross-origin"
# CSP z analytics.szmidtke.pl — specyficzne dla naszego bloku.
assert_header "content-security-policy" "analytics.szmidtke.pl"

# Plausible — jeśli tracker ma być włączony, tag musi być w HTML. Brak tagu przy
# włączonej konfiguracji oznacza że PUBLIC_PLAUSIBLE_DOMAIN nie trafił do builda
# (build-arg, Dockerfile, compose) — klasyczna regresja sprzed fixa .dockerignore.
if curl -sS -m 10 "${BASE}/" | grep -qi 'data-domain="szmidtke.pl"'; then
  printf "  [OK  plausible] data-domain=\"szmidtke.pl\" w HTML\n"
else
  printf "  [WARN plausible] brak data-domain w HTML — sprawdź PUBLIC_PLAUSIBLE_DOMAIN w .env na VPS + rebuild\n"
  # WARN, nie FAIL — jeśli świadomie nie używasz Plausible, smoke nie powinien blokować deployu.
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✓ live smoke OK"
  exit 0
fi
echo "✗ live smoke: $FAIL błędów"
exit 1
