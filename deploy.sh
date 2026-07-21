#!/bin/bash
set -e

echo "Starting deployment..."
cd /root/bidunyam

# ─────────────────────────────────────────────────────────────
# 0) DEPLOY ÖNCESİ YEDEK (veri kaybına karşı geri dönüş noktası)
#    Yedekler ./backups altında tutulur, son 10 tanesi saklanır.
# ─────────────────────────────────────────────────────────────
BACKUP_DIR="/root/bidunyam/backups"
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "Yedek aliniyor: PostgreSQL..."
if docker ps --format '{{.Names}}' | grep -q '^trendyol_postgres$'; then
  docker exec trendyol_postgres pg_dump -U "${POSTGRES_USER:-trendyol_admin}" -d "${POSTGRES_DB:-trendyol_users}" \
    > "$BACKUP_DIR/postgres-$STAMP.sql" 2>/dev/null \
    && echo "  ✔ postgres-$STAMP.sql" \
    || echo "  ! PostgreSQL yedegi alinamadi (devam ediliyor)"
else
  echo "  ! trendyol_postgres calismiyor, yedek atlandi"
fi

echo "Yedek aliniyor: MongoDB..."
if docker ps --format '{{.Names}}' | grep -q '^trendyol_mongo$'; then
  docker exec trendyol_mongo mongodump --archive --quiet \
    > "$BACKUP_DIR/mongo-$STAMP.archive" 2>/dev/null \
    && echo "  ✔ mongo-$STAMP.archive" \
    || echo "  ! MongoDB yedegi alinamadi (devam ediliyor)"
else
  echo "  ! trendyol_mongo calismiyor, yedek atlandi"
fi

# Eski yedekleri temizle (son 10 tanesi kalsin)
ls -1t "$BACKUP_DIR"/postgres-*.sql 2>/dev/null | tail -n +11 | xargs -r rm --
ls -1t "$BACKUP_DIR"/mongo-*.archive 2>/dev/null | tail -n +11 | xargs -r rm --

echo "Pulling latest code..."
git reset --hard HEAD
git pull origin main

echo "Restoring docker-compose.yml..."
git checkout docker-compose.yml

echo "Building docker images..."
docker compose build

# NOT: 'docker compose down -v' ASLA kullanma — named volume'leri (pg-data,
# mongo-data, redis-data, product-uploads) siler ve tum veriyi yok eder.
echo "Starting containers..."
docker compose up -d

echo "Deployment finished successfully!"
echo "Yedekler: $BACKUP_DIR"
