#!/usr/bin/env bash
# Daily backup Plausible — postgres (users/sites) + clickhouse (events + sessions).
# Cron: 0 4 * * * /opt/szmidtke/app/scripts/backup-plausible.sh >> /var/log/plausible-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="/opt/backups/plausible"
RETENTION_DAYS=14
DATE=$(date +%F)
COMPOSE="/opt/szmidtke/app/docker-compose.yml"

mkdir -p "$BACKUP_DIR"

# Postgres — dump users/sites/goals.
docker compose -f "$COMPOSE" exec -T plausible_db \
  pg_dump -U postgres plausible_db | gzip > "$BACKUP_DIR/pg-$DATE.sql.gz"

# ClickHouse — events i sessions jako TSV (przy małym ruchu wystarczy;
# do dużego wolumenu rozważ natywny BACKUP TO Disk/S3).
docker compose -f "$COMPOSE" exec -T plausible_events_db \
  clickhouse-client --query "SELECT * FROM plausible_events_db.events FORMAT TabSeparatedWithNames" \
  | gzip > "$BACKUP_DIR/ch-events-$DATE.tsv.gz"

docker compose -f "$COMPOSE" exec -T plausible_events_db \
  clickhouse-client --query "SELECT * FROM plausible_events_db.sessions FORMAT TabSeparatedWithNames" \
  | gzip > "$BACKUP_DIR/ch-sessions-$DATE.tsv.gz"

# Retention — usuń starsze niż RETENTION_DAYS.
find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -Iseconds)] Plausible backup OK: $DATE"
