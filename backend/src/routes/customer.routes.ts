import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCustomerSchema, updateCustomerSchema, addFollowUpSchema, listCustomersSchema } from '../validators/customer.validator';

const router = Router();

router.use(authenticate);

router.get('/', restrictTo('Admin', 'Sales', 'Accounts'), validate(listCustomersSchema), customerController.list);
router.post('/', restrictTo('Admin', 'Sales'), validate(createCustomerSchema), customerController.create);
router.get('/:id', restrictTo('Admin', 'Sales', 'Accounts'), customerController.getOne);
router.patch('/:id', restrictTo('Admin', 'Sales'), validate(updateCustomerSchema), customerController.update);
router.delete('/:id', restrictTo('Admin'), customerController.delete);

// Follow-ups
router.post('/:id/follow-ups', restrictTo('Admin', 'Sales'), validate(addFollowUpSchema), customerController.addFollowUp);
router.get('/:id/follow-ups', restrictTo('Admin', 'Sales', 'Accounts'), customerController.getFollowUps);

export default router;
