// for tracking link visits and redirecting
import {Router } from 'express';
import{ getDealerStats, trackAndRedirect } from './analytics.controller';

const router = Router();

router.get('/stats/:dealerId', getDealerStats);
// get /: linkHash
router.get('/:linkHash', trackAndRedirect);
export default router;