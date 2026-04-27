#!/usr/bin/env bash
# Deploy szmidtke.pl — push na GitHub + pull/rebuild na VPS jednym ruchem.
# Uruchamiaj z root repo: ./scripts/deploy.sh
#
# Wymaga:
#   - git remote 'origin' wskazujący na GitHub
#   - SSH klucz podpięty do $VPS_HOST (test: ssh $VPS_HOST whoami)
#   - Docker compose działa pod ubuntu na VPS (member grupy docker)
#
# Konfiguracja przez ENV (opcjonalna — domyślne wartości niżej):
#   VPS_HOST=ubuntu@57.128.225.170
#   VPS_PATH=/opt/szmidtke/app
#   SITE_URL=https://szmidtke.pl

set -euo pipefail

BRANCH="${1:-main}"
VPS_HOST="${VPS_HOST:-ubuntu@57.128.225.170}"
VPS_PATH="${VPS_PATH:-/opt/szmidtke/app}"
SITE_URL="${SITE_URL:-https://szmidtke.pl}"

# 1. Push na GitHub (źródło prawdy + backup)
echo "→ git push origin $BRANCH"
git push origin "$BRANCH"

# 2. Pull + rebuild na VPS
echo "→ ssh $VPS_HOST: pull + rebuild"
ssh "$VPS_HOST" "cd $VPS_PATH && git pull && docker compose up -d --build"

# 3. Smoke test — czy strona odpowiada 200
echo "→ smoke test: $SITE_URL"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ deploy done — $SITE_URL → $HTTP_CODE"
else
  echo "⚠ deploy zakończony, ale $SITE_URL zwraca $HTTP_CODE — sprawdź docker compose logs"
  exit 1
fi
