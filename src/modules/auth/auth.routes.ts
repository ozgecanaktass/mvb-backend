import { Router } from 'express';
import { login, logout, createUser } from './auth.controller';
import { catchAsync } from '../../shared/utils/catchAsync';
import { protect, restrictTo } from '../../middlewares/auth.middleware'; // restrictTo eklendi

const router = Router();

// --- PUBLIC ROUTES ---

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: login and get JWT token
 */
router.post('/login', catchAsync(login));

// --- PROTECTED ROUTES ---

/**
 * @swagger
 * /auth/logout:
 * post:
 * summary: Logout (Token invalidation)
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/users:
 * post:
 * summary: create a new user (Producer Admin or Dealer Admin)
 * description: producer_admin can create users with any dealerId or none; dealer_admin can only create users for their own dealerId.
 * security:
 * - bearerAuth: []
 */
// Access Control:
// 1. must be authenticated (protect)
// 2. must have role producer_admin or dealer_admin (restrictTo)
router.post('/users', protect, restrictTo('producer_admin', 'dealer_admin'), catchAsync(createUser));

export default router;