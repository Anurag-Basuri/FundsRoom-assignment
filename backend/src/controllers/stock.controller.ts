import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { stockService } from '../services/stock.service';

export const stockController = {
  createMovement: asyncHandler(async (req: Request, res: Response) => {
    const { product_id, quantity, movement_type, reason } = req.body;
    const movement = await stockService.recordMovement(
      product_id,
      quantity,
      movement_type,
      reason,
      req.user!.id
    );
    apiResponse.created(res, movement);
  }),

  listMovements: asyncHandler(async (req: Request, res: Response) => {
    const { product_id, movement_type, date_from, date_to, page = '1', limit = '20' } = req.query as any;
    const result = await stockService.listMovements({
      product_id,
      movement_type,
      date_from,
      date_to,
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
};
