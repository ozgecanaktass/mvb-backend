import { Router } from 'express';
import { trackAndRedirect, getDealerStats } from './analytics.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

// GET /l/stats/:dealerId -> return dealer stats for given dealerId
router.get('/stats/:dealerId', protect, getDealerStats);

// GET /l/:linkHash
router.get('/:linkHash', trackAndRedirect);

export default router;