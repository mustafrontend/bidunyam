#!/bin/bash
set -e

echo "Starting deployment..."
cd /root/bidunyam

echo "Pulling latest code..."
git reset --hard HEAD
git pull origin main

echo "Restoring docker-compose.yml..."
git checkout docker-compose.yml

echo "Using modern 'docker compose' plugin instead of legacy 'docker-compose'..."

echo "Building docker images..."
docker compose build

echo "Starting containers..."
docker compose up -d

echo "Deployment finished successfully!"
