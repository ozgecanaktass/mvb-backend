import { Router } from 'express';
import { trackAndRedirect, getDealerStats } from './analytics.controller';

const router = Router();

// GET /l/stats/:dealerId 
router.get('/stats/:dealerId', getDealerStats);

// GET /l/:linkHash 
router.get('/:linkHash', trackAndRedirect);

export default router;