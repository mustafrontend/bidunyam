# Bidunyam Microservices Demo

Bu proje, Trendyol benzeri bir e-ticaret akisini mikroservis mimarisi ile gosterir.

## Mimari

- `frontend` (Next.js)
- `gateway` (API Gateway)
- `services/auth-service`
- `services/product-service`
- `services/cart-service`
- `services/order-service`
- `services/search-service`
- `services/log-service`
- Altyapi: PostgreSQL, MongoDB, Redis, Elasticsearch (opsiyonel Kibana)

## Gereksinimler

- Docker Desktop (Docker Engine + Compose)
- Git

Kontrol:

```bash
docker --version
docker compose version
```

## Projeyi Ayaga Kaldirma

1. Proje klasorune girin:

```bash
cd C:\Users\mustafaozturk\Desktop\Projects\trendyolDemo
```

2. `.env` dosyasinin var oldugunu kontrol edin (repo icinde mevcut).

3. Tum servisleri build edip baslatin:

```bash
docker compose up --build -d
```

4. Durumu kontrol edin:

```bash
docker compose ps
```

5. Log izlemek icin:

```bash
docker compose logs -f
```

## Erisim Noktalari

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Elasticsearch: http://localhost:9200
- Kibana (opsiyonel): http://localhost:5601

Kibana'yi acmak icin:

```bash
docker compose --profile observability up -d kibana
```

## Durdurma ve Temizleme

Servisleri durdur:

```bash
docker compose down
```

Servisleri volume'lerle birlikte tamamen temizle:

```bash
docker compose down -v
```

## Sik Karsilasilan Problemler

1. Port cakisiyor (`3000`, `8080`, `9200`):
   - Bu portlari kullanan surecleri kapatin.

2. Konteynerler acildi ama servis hazir degil:
   - Birkac saniye bekleyip tekrar kontrol edin:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

3. Ilk build uzun suruyor:
   - Normaldir. Sonraki buildler Docker cache ile hizlanir.

## Gelistirme Notlari

- Mimari akis dokumani: `MICROSERVICES_FLOW.md`
- Frontend ic detaylari: `frontend/README.md`
