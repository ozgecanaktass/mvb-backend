import {Router} from 'express';
import { createDealer, getDealers} from './dealers.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

//if the request is...
router.get('/', getDealers);
// request will be passed through the protect middleware first (auth.middleware.ts)
router.post('/', protect,createDealer); // protected route

export default router;