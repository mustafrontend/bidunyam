# 🚀 Trendyol Demo - Mikroservis Akış Diyagramı ve Teknik Analiz

Bu döküman, projenin mimari yapısını ve bir kullanıcının sepetine ürün ekleyip sipariş vermesi sürecindeki teknik adımları açıklar.

---

## 🏗️ Genel Mimari Bileşenleri

1.  **Frontend (Next.js):** Kullanıcı arayüzü, state yönetimi (Zustand) ve mikro-etkileşimler (Framer Motion).
2.  **API Gateway (Express Proxy):** Tüm dış isteklerin karşılandığı tek nokta. İstekleri ilgili servise yönlendirir.
3.  **Auth Service (Node/Prisma/PostgreSQL):** Kullanıcı kayıt, giriş ve JWT üretim merkezi.
4.  **Product Service (Node/Mongoose/MongoDB):** Ürün kataloğu ve detay yönetimi.
5.  **Cart Service (Node/Redis):** Kullanıcıya özel sepetin Redis üzerinde yüksek performansla saklanması.
6.  **Order Service (Node/Mongoose/MongoDB):** Ödeme simülasyonu ve siparişlerin kalıcı olarak kaydedilmesi.

---

## 🔄 Uçtan Uca Sipariş Akışı (Technical Journey)

### 1. Durak: Giriş ve Kimlik Doğrulama (Authentication)
*   **Aksiyon:** Kullanıcı `ali@demo.com` / `123` ile giriş yapar.
*   **Teknik Akış:** 
    *   `UI` -> `Gateway` (Port 8080) -> `Auth Service` (Port 3001).
    *   `Auth Service`, PostgreSQL'de şifreyi doğrular ve bir **JWT (JSON Web Token)** üretir.
    *   Bu JWT, kullanıcının "kimliği"dir. Tarayıcıda (LocalStorage) saklanır.
*   **Redis Rolü:** Üretilen token, hızlı doğrulama için Redis'e de yazılır (Session Whitelist).

### 2. Durak: Sepete Ürün Ekleme (Cart Management)
*   **Aksiyon:** Kullanıcı bir ürünü sepete ekler.
*   **Teknik Akış:**
    *   `Frontend`, `CartStore` üzerinden `POST /cart/add` isteği atar.
    *   `Gateway` bu isteği `Cart Service`'e (Port 3004) iletir.
    *   `Cart Service`, JWT içindeki `userId`'yi okur ve Redis üzerinde `cart:userId` anahtarına ürünü ekler.
### 2. Durak: Sepete Ürün Ekleme (Cart Management)
*   **Aksiyon:** Kullanıcı bir ürünü sepete ekler.
*   **Teknik Akış:**
    *   `Frontend`, `CartStore` üzerinden `POST /cart/add` isteği atar.
    *   `Gateway` bu isteği `Cart Service`'e (Port 3004) iletir.
    *   `Cart Service`, JWT içindeki `userId`'yi okur ve Redis üzerinde `cart:userId` anahtarına ürünü ekler.

### 3. Durak: Akıllı Arama (Elasticsearch)
*   **Aksiyon:** Kullanıcı arama çubuğuna bir kelime yazar.
*   **Teknik Akış:**
    *   `Navbar` üzerinden anlık olarak `Search Service`'e (Port 3006) istek gider.
    *   `Search Service`, **Elasticsearch** üzerinde **Fuzzy Search** (hatalı yazımı düzeltme) ve **Boosting** (önemli alanları öne çıkarma) yaparak milisaniyeler içinde sonuç döner.

### 4. Durak: Kuyruk Tabanlı Sipariş (BullMQ)
*   **Aksiyon:** Kullanıcı "Sepeti Onayla" butonuna basar.
*   **Teknik Akış:**
    *   `Order Service` (Port 3005) isteği alır ama veritabanına hemen yazmaz.
    *   İsteği bir **Job** olarak `BullMQ` (Redis) kuyruğuna atar ve kullanıcıya "Siparişiniz işleme alındı" der.
    *   Arka planda çalışan bir **Worker**, kuyruktan bu işi çeker ve MongoDB'ye siparişi kaydeder.
    *   **Neden?** Bu yapı, yoğun trafik anlarında (Black Friday vb.) veritabanının çökmesini engeller.

### 5. Durak: Başarı ve Temizlik (Cleanup)
*   **Aksiyon:** Sipariş başarıyla oluşturulduktan sonra sepet temizlenir.
*   **Teknik Akış:**
    *   Sipariş başarılı dönünce, `Frontend` iki işlem yapar:
        1.  `CartStore` içindeki yerel veriyi siler.
        2.  `Cart Service`'e `DELETE /cart` isteği atarak Redis'teki sepeti de temizler.
    *   Kullanıcıya `canvas-confetti` ile başarı mesajı gösterilir.

---

## 📊 Veritabanı Dağılımı ve Görevleri

| Bileşen | Teknoloji | Görevi |
| :--- | :--- | :--- |
| **Users DB** | PostgreSQL | İlişkisel veri, güvenlik, kullanıcı hesapları. |
| **Products & Orders DB** | MongoDB | Esnek veri yapısı, ürün özellikleri, binlerce sipariş kaydı. |
| **Session & Cart** | Redis | Hız, anlık veri, geçici oturum saklama. |
| **Event Bus** | Redis Pub/Sub | Servisler arası asenkron iletişim (örn: kullanıcı kayıt olunca log servisine haber verme). |

---

## 🛠️ Ağ İletişimi (Docker Network)

Tüm servisler `trendyol-net` adındaki izole bir ağda çalışır.
-   **Dış Dünya:** Sadece `Gateway (8080)` ve `Frontend (3000)` portlarına erişebilir.
-   **İç Dünya:** Servisler birbirlerine `http://auth-service:3001` gibi servis isimleriyle DNS üzerinden erişir. Bu, sistemin güvenliğini sağlar.

---

> **Motto:** "Kod bir heykeldir. Her servisin bir amacı, her isteğin bir yolu olmalı."
