import { Router } from 'express';
import { challanController } from '../controllers/challan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createChallanSchema, updateChallanSchema, listChallansSchema } from '../validators/challan.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(listChallansSchema), challanController.list);
router.post('/', restrictTo('Admin', 'Sales'), validate(createChallanSchema), challanController.create);
router.get('/:id', challanController.getOne);
router.patch('/:id', restrictTo('Admin', 'Sales'), validate(updateChallanSchema), challanController.update);
router.patch('/:id/confirm', restrictTo('Admin', 'Sales'), challanController.confirm);
router.patch('/:id/cancel', restrictTo('Admin', 'Sales'), challanController.cancel);
router.get('/:id/invoice', restrictTo('Admin', 'Sales', 'Accounts'), challanController.invoice);

export default router;
