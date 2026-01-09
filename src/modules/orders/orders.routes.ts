import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from './orders.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/orders 
router.get('/', protect, getOrders);

// POST /api/v1/orders -> Create a new order (from Configurator)
// 'protect' middleware is used effectively as orders are created by authenticated dealers/admins.
router.post('/', protect, createOrder);

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', protect, updateOrderStatus);

/**
 * Express router for handling order management operations.
 * Use this router to define all order-related endpoints.
 */
export default router;