#!/usr/bin/env bash
# Skrót deploy — push do GitHub (backup + źródło prawdy) i na VPS (bare repo).
# Uruchamiaj z root repo: ./scripts/deploy.sh

set -euo pipefail

BRANCH="${1:-main}"

echo "→ git push origin $BRANCH"
git push origin "$BRANCH"

echo "→ git push vps $BRANCH (trigger deploy via post-receive hook)"
git push vps "$BRANCH"

echo "✓ deploy triggered. Obserwuj logi: ssh vps 'docker compose -f /opt/szmidtke/app/docker-compose.yml logs -f'"
