import e, {Router} from 'express';
import { createDealer, getDealers} from './dealers.controller';

const router = Router();

//if the request is...
router.get('/', getDealers);
router.post('/', createDealer);

export default router;