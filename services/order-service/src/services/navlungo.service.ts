// ─────────────────────────────────────────────────────────────
// Navlungo Kargo Entegrasyonu (Mockup)
// Gerçek Navlungo API'si yerine, gönderi oluşturma, takip numarası üretme
// ve kargo durumu ilerletme akışını taklit eden sahte servis.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';

const CARRIERS = ['Yurtiçi Kargo', 'MNG Kargo', 'Aras Kargo', 'PTT Kargo', 'Sürat Kargo'];

// Takip durum akışı ve etiketleri
export const TRACKING_FLOW: Array<{ status: string; label: string }> = [
  { status: 'CREATED', label: 'Gönderi oluşturuldu, kargo bekliyor' },
  { status: 'PICKED_UP', label: 'Kargo şubesinden teslim alındı' },
  { status: 'IN_TRANSIT', label: 'Transfer merkezine ulaştı' },
  { status: 'OUT_FOR_DELIVERY', label: 'Dağıtıma çıktı' },
  { status: 'DELIVERED', label: 'Teslim edildi' },
];

const CITIES = ['İstanbul Anadolu', 'İstanbul Avrupa', 'Ankara', 'İzmir', 'Bursa Transfer'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const NavlungoService = {
  // Navlungo "createShipment" benzeri — gönderi oluşturur, takip no üretir
  createShipment(input: { desi?: number; address?: string; recipientName?: string }) {
    const carrier = pick(CARRIERS);
    const trackingNumber = 'NAV' + crypto.randomBytes(5).toString('hex').toUpperCase();
    const barcode = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    const shipmentId = 'SHP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const desi = input.desi || Math.round((1 + Math.random() * 5) * 10) / 10;

    // Tahmini teslimat: 1-3 iş günü
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1 + Math.floor(Math.random() * 3));

    return {
      navlungoShipmentId: shipmentId,
      carrier,
      trackingNumber,
      barcode,
      desi,
      labelUrl: `/api/orders/labels/${shipmentId}.pdf`,
      estimatedDelivery,
      shippedAt: new Date(),
      events: [
        {
          status: 'CREATED',
          label: TRACKING_FLOW[0].label,
          location: pick(CITIES),
          timestamp: new Date(),
        },
      ],
    };
  },

  // Bir sonraki takip durumunu üretir (webhook simülasyonu)
  nextEvent(currentStatus: string) {
    const idx = TRACKING_FLOW.findIndex((f) => f.status === currentStatus);
    if (idx < 0 || idx >= TRACKING_FLOW.length - 1) return null;
    const next = TRACKING_FLOW[idx + 1];
    return {
      status: next.status,
      label: next.label,
      location: next.status === 'DELIVERED' ? 'Alıcı adresi' : pick(CITIES),
      timestamp: new Date(),
    };
  },

  // Takip durumundan sipariş statüsüne eşleme
  orderStatusFromTracking(trackingStatus: string): string {
    switch (trackingStatus) {
      case 'CREATED':
        return 'SHIPPED';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'IN_TRANSIT';
      case 'DELIVERED':
        return 'DELIVERED';
      default:
        return 'SHIPPED';
    }
  },
};
