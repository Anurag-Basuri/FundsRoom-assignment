import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createMovementSchema, listMovementsSchema } from '../validators/stock.validator';

const router = Router();

router.use(authenticate);

router.post('/movements', restrictTo('Admin', 'Warehouse'), validate(createMovementSchema), stockController.createMovement);
router.get('/movements', restrictTo('Admin', 'Warehouse', 'Accounts'), validate(listMovementsSchema), stockController.listMovements);

export default router;
