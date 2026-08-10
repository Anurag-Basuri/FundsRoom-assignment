import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { customerService } from '../services/customer.service';

export const customerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { search, status, customer_type, page = '1', limit = '20' } = req.query as any;
    const result = await customerService.listCustomers({
      search,
      status,
      customer_type,
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
    const customer = await customerService.getCustomer(req.params.id);
    apiResponse.success(res, customer);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.createCustomer(req.body, req.user!.id);
    apiResponse.created(res, customer);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    apiResponse.success(res, customer);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.deleteCustomer(req.params.id);
    apiResponse.success(res, result);
  }),

  addFollowUp: asyncHandler(async (req: Request, res: Response) => {
    const followUp = await customerService.addFollowUp(req.params.id, req.body, req.user!.id);
    apiResponse.created(res, followUp);
  }),

  getFollowUps: asyncHandler(async (req: Request, res: Response) => {
    const followUps = await customerService.getFollowUps(req.params.id);
    apiResponse.success(res, followUps);
  }),
};
