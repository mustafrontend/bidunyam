import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../repositories/prisma.client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import fs from 'fs';

// Validation Schemas
const createCampaignSchema = z.object({
  title: z.string().min(3, "Kampanya adı en az 3 karakter olmalıdır"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).default("PERCENTAGE"),
  discountValue: z.string().transform(v => parseFloat(v)).refine(v => v > 0, "İndirim değeri 0'dan büyük olmalıdır"),
  startDate: z.string().transform(v => new Date(v)),
  endDate: z.string().transform(v => new Date(v)),
});

const joinCampaignSchema = z.object({
  products: z.array(z.object({
    productId: z.string(),
    campaignPrice: z.number().positive()
  })).min(1, "En az 1 ürün seçilmelidir")
});

export class CampaignController {
  
  // ==========================================
  // ADMIN METOTLARI
  // ==========================================

  static async createCampaign(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = createCampaignSchema.parse(req.body);
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/campaigns/${req.file.filename}`;
      }

      const campaign = await prisma.campaign.create({
        data: {
          title: parsed.title,
          description: parsed.description,
          discountType: parsed.discountType,
          discountValue: parsed.discountValue,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          imageUrl: imageUrl,
          status: "ACTIVE"
        }
      });

      return res.status(201).json({ success: true, data: campaign });
    } catch (error: any) {
      console.error("Campaign Create Error:", JSON.stringify(error, null, 2));
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "Geçersiz veri", error: error.errors || error.message });
    }
  }

  static async getAdminCampaigns(req: AuthenticatedRequest, res: Response) {
    try {
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
      return res.status(200).json({ success: true, data: campaigns });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Kampanyalar getirilemedi", error: error.message });
    }
  }

  static async getCampaignById(req: AuthenticatedRequest, res: Response) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
      if (!campaign) return res.status(404).json({ success: false, message: "Kampanya bulunamadı" });
      return res.status(200).json({ success: true, data: campaign });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Hata", error: error.message });
    }
  }

  static async updateCampaign(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, description, status, discountType, discountValue, startDate, endDate } = req.body;
      
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (status) updateData.status = status;
      if (discountType) updateData.discountType = discountType;
      if (discountValue) updateData.discountValue = parseFloat(discountValue);
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      
      if (req.file) {
        updateData.imageUrl = `/uploads/campaigns/${req.file.filename}`;
      }

      const campaign = await prisma.campaign.update({
        where: { id: req.params.id },
        data: updateData
      });

      return res.status(200).json({ success: true, data: campaign });
    } catch (error: any) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "Güncellenemedi", error: error.message });
    }
  }

  static async getCampaignParticipants(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.query; // optional filter
      const where: any = { campaignId: req.params.id };
      if (status) where.status = status;

      const participants = await prisma.campaignProduct.findMany({
        where,
        include: {
          product: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, data: participants });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Katılımcılar getirilemedi", error: error.message });
    }
  }

  static async updateParticipantStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { campaignId, productId } = req.params;
      const { status } = req.body; // PENDING, APPROVED, REJECTED

      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, message: "Geçersiz statü" });
      }

      const updated = await prisma.campaignProduct.update({
        where: {
          campaignId_productId: { campaignId, productId }
        },
        data: { status },
        include: { product: true }
      });

      // Eğer onaylandıysa ve ürün fiyatı indirilmek isteniyorsa, burada product fiyatı da güncellenebilir 
      // Ancak genellikle ana ürün fiyatı dokunulmaz, sepet hesaplamasında kampanyadan fiyat çekilir. 
      // Veya ana ürün indirimli fiyata çekilir. Şimdilik sadece statü güncelleyelim.

      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: "Durum güncellenemedi", error: error.message });
    }
  }


  // ==========================================
  // SELLER METOTLARI
  // ==========================================

  static async getActiveCampaigns(req: AuthenticatedRequest, res: Response) {
    try {
      const now = new Date();
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          products: {
            where: { status: 'APPROVED' },
            include: {
              product: true
            }
          }
        },
        orderBy: { endDate: 'asc' }
      });
      return res.status(200).json({ success: true, data: campaigns });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Kampanyalar getirilemedi", error: error.message });
    }
  }

  static async getSellerParticipations(req: AuthenticatedRequest, res: Response) {
    try {
      const sellerId = req.params.sellerId;
      // Güvenlik: İstek yapan kişi kendi katılımlarını görmeli (veya Admin)
      if (req.user?.role !== 'ADMIN' && req.user?.id !== sellerId) {
        return res.status(403).json({ success: false, message: "Yetkisiz erişim" });
      }

      const participations = await prisma.campaignProduct.findMany({
        where: { sellerId },
        include: {
          campaign: true,
          product: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, data: participations });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Katılımlar getirilemedi", error: error.message });
    }
  }

  static async joinCampaign(req: AuthenticatedRequest, res: Response) {
    try {
      const campaignId = req.params.id;
      const sellerId = req.user!.id;
      const parsed = joinCampaignSchema.parse(req.body);

      // Kampanya aktif mi kontrolü
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign || campaign.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: "Kampanya bulunamadı veya aktif değil" });
      }

      const results = [];
      
      // Çoklu ürün katılımını veritabanına ekle
      for (const item of parsed.products) {
        // İlgili ürün bu satıcıya mı ait?
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || product.userId !== sellerId) {
          continue; // Satıcının kendi ürünü değilse atla
        }

        // İndirim kontrolü
        let isValidPrice = true;
        if (campaign.discountType === 'PERCENTAGE') {
          const requiredPrice = product.price * (1 - (campaign.discountValue / 100));
          if (item.campaignPrice > requiredPrice) {
            isValidPrice = false; // Kurala uymuyor
          }
        } else if (campaign.discountType === 'FIXED_AMOUNT') {
          const requiredPrice = product.price - campaign.discountValue;
          if (item.campaignPrice > requiredPrice) {
            isValidPrice = false;
          }
        }

        if (!isValidPrice) {
          // İstenirse burada return error yapılabilir veya sadece bu ürün reddedilebilir
          // Biz reddedilmiş olarak işaretleyebiliriz veya atlayabiliriz. PENDING ekleyip admin'e bırakıyoruz.
        }

        // Upsert ile ekle veya güncelle
        const record = await prisma.campaignProduct.upsert({
          where: { campaignId_productId: { campaignId, productId: item.productId } },
          update: { campaignPrice: item.campaignPrice, status: 'PENDING' },
          create: {
            campaignId,
            productId: item.productId,
            sellerId,
            campaignPrice: item.campaignPrice,
            status: 'PENDING'
          }
        });
        results.push(record);
      }

      return res.status(200).json({ 
        success: true, 
        message: `${results.length} ürün kampanyaya eklendi`, 
        data: results 
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: "Katılım başarısız", error: error.errors || error.message });
    }
  }

}
