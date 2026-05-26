import { Router, Request, Response } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { authenticate, optionalAuthenticate, requireAdmin, AuthenticatedRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Resim yükleme yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'campaigns');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `camp-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Admin Routes (Super Admin Only)
router.post('/admin', authenticate, requireAdmin, upload.single('image'), CampaignController.createCampaign);
router.get('/admin', authenticate, requireAdmin, CampaignController.getAdminCampaigns);
router.get('/admin/:id', authenticate, requireAdmin, CampaignController.getCampaignById);
router.put('/admin/:id', authenticate, requireAdmin, upload.single('image'), CampaignController.updateCampaign);
router.get('/admin/:id/participants', authenticate, requireAdmin, CampaignController.getCampaignParticipants);
router.put('/admin/:campaignId/products/:productId/status', authenticate, requireAdmin, CampaignController.updateParticipantStatus);

// Seller Routes
router.get('/active', optionalAuthenticate, CampaignController.getActiveCampaigns);
router.get('/seller/:sellerId', authenticate, CampaignController.getSellerParticipations);
router.post('/:id/join', authenticate, CampaignController.joinCampaign);

export default router;
