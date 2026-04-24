#!/usr/bin/env bash
# =============================================================================
# Diagnostyka 403 / awarii na VPS — szmidtke.pl
# Uruchom NA VPS: bash /opt/szmidtke/app/scripts/diagnose-vps.sh
# Albo z lokalu: ssh vps 'bash -s' < scripts/diagnose-vps.sh
#
# Wypluwa stan docker / nginx / portów / certów — wszystko co pozwala odróżnić
# warianty 403 (nginx vs cloudflare vs aplikacja vs config error).
# =============================================================================
set +e

APP_DIR="${APP_DIR:-/opt/szmidtke/app}"
DOMAIN="${DOMAIN:-szmidtke.pl}"

hr() { printf '\n=========== %s ===========\n' "$1"; }

hr "1. docker ps (czy kontener żyje?)"
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>&1

hr "2. docker logs szmidtkepl --tail 80"
docker logs szmidtkepl --tail 80 2>&1 || echo "Kontener 'szmidtkepl' nie istnieje lub nie startuje."

hr "3. Sprawdź port 3000 lokalnie na VPS"
# Jeśli kontener słucha, powinno być 200. Jeśli 'Connection refused' — kontener nie żyje.
curl -sS -o /tmp/_body3000 -w "HTTP %{http_code} | size=%{size_download}\n" -m 5 http://127.0.0.1:3000/ 2>&1
head -5 /tmp/_body3000 2>/dev/null
echo "--- /api/subscribe POST bezpośrednio na kontener ---"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -m 5 \
  -X POST -H "Content-Type: application/json" -d '{"email":"x@x.com"}' \
  http://127.0.0.1:3000/api/subscribe 2>&1

hr "4. nginx -t (czy config się w ogóle kompiluje)"
sudo nginx -t 2>&1

hr "5. Aktywny config szmidtke.pl"
for f in /etc/nginx/sites-enabled/szmidtke.pl /etc/nginx/sites-enabled/default; do
  if [ -f "$f" ] || [ -L "$f" ]; then
    echo "--- $f ---"
    sudo cat "$f"
  fi
done

hr "6. Listy nginx processes + porty"
sudo ss -tlnp | grep -E ':(80|443|3000|8000|8123)\b' 2>&1 || sudo netstat -tlnp | grep -E ':(80|443|3000|8000|8123)\b' 2>&1

hr "7. Certy letsencrypt"
sudo ls -la /etc/letsencrypt/live/ 2>&1

hr "8. Logi nginx — ostatnie błędy"
sudo tail -40 /var/log/nginx/error.log 2>&1
echo "--- access.log — ostatnie 15 żądań ---"
sudo tail -15 /var/log/nginx/access.log 2>&1

hr "9. Testy request → response (co FAKTYCZNIE widzi świat)"
for target in "http://127.0.0.1/" "https://127.0.0.1/" "http://${DOMAIN}/" "https://${DOMAIN}/"; do
  echo "--- $target ---"
  curl -skI -m 8 -H "Host: ${DOMAIN}" "$target" 2>&1 | head -20
done

hr "10. Sprawdź czy coś stoi przed nginx (Cloudflare / inne)"
# Jeśli Host header ma znaczenie + serwer odpowiada inaczej bez Hosta → jest proxy.
echo "--- curl -sI https://${DOMAIN}/ — nagłówki odpowiedzi ---"
curl -sI -m 8 "https://${DOMAIN}/" 2>&1 | head -25
echo "--- DNS lookup — czy A-record wskazuje na IP VPS ---"
getent hosts "$DOMAIN" 2>&1
echo "--- nasz external IP ---"
curl -s -m 5 https://api.ipify.org 2>&1; echo

hr "11. .env na VPS (WARTOŚCI UKRYTE — tylko klucze)"
if [ -f "$APP_DIR/.env" ]; then
  sudo awk -F= '/^[A-Z]/{print $1"="(length($2)>0 ? "<set>" : "<EMPTY>")}' "$APP_DIR/.env"
else
  echo "UWAGA: brak $APP_DIR/.env"
fi

hr "12. Czas startu kontenera vs czas systemu"
echo "Kontener startował:"
docker inspect szmidtkepl --format '{{.State.StartedAt}} (status: {{.State.Status}}, exit: {{.State.ExitCode}})' 2>&1
echo "System teraz: $(date -Iseconds)"

hr "DIAGNOSTYKA GOTOWA"
echo "Wyślij cały powyższy output Marcinowi / claude'owi do analizy."
