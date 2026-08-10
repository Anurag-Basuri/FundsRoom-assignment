import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { restrictTo } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema, listProductsSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/low-stock', restrictTo('Admin', 'Warehouse'), productController.getLowStock);
router.get('/', validate(listProductsSchema), productController.list);
router.post('/', restrictTo('Admin', 'Warehouse'), validate(createProductSchema), productController.create);
router.get('/:id', productController.getOne);
router.patch('/:id', restrictTo('Admin', 'Warehouse'), validate(updateProductSchema), productController.update);
router.delete('/:id', restrictTo('Admin'), productController.delete);

export default router;
