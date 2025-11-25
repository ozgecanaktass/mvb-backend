import {Router} from 'express';
import { login, logout } from './auth.controller';
import { catchAsync } from '../../shared/utils/catchAsync';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', catchAsync(login));

// POST /api/v1/auth/logout
router.post('/logout', catchAsync(logout));

export default router;