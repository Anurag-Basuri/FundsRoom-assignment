import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { productService } from '../services/product.service';

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { search, category, low_stock, page = '1', limit = '20' } = req.query as any;
    const result = await productService.listProducts({
      search,
      category,
      low_stock,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
    });

    apiResponse.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProduct(req.params.id);
    apiResponse.success(res, product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    apiResponse.created(res, product);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    apiResponse.success(res, product);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.deleteProduct(req.params.id);
    apiResponse.success(res, result);
  }),

  getLowStock: asyncHandler(async (_req: Request, res: Response) => {
    const products = await productService.getLowStock();
    apiResponse.success(res, products);
  }),
};
