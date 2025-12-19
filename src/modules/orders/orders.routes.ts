import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from './orders.controller';
// Middleware'i import et
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/orders 
router.get('/', protect, getOrders);

// POST /api/v1/orders -> Yeni sipariş oluştur (Konfigüratörden gelir)
// Buraya da 'protect' ekleyebilirsin veya public bırakacaksan controller'da user kontrolünü kaldırmalısın
// Ama logic gereği bayi/admin oluşturuyorsa protect olmalı
router.post('/', protect, createOrder);

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', protect, updateOrderStatus);

export default router;