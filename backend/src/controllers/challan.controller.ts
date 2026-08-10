import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { challanService } from '../services/challan.service';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export const challanController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, customer_id, date_from, date_to, page = '1', limit = '20' } = req.query as any;
    const result = await challanService.listChallans({
      status,
      customer_id,
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

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.getChallan(req.params.id);
    apiResponse.success(res, challan);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { customer_id, items } = req.body;
    const challan = await challanService.createChallan(customer_id, items, req.user!.id);
    apiResponse.created(res, challan);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body;
    const challan = await challanService.updateChallan(req.params.id, items);
    apiResponse.success(res, challan);
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.confirmChallan(req.params.id, req.user!.id);
    apiResponse.success(res, challan);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.cancelChallan(req.params.id, req.user!.id);
    apiResponse.success(res, challan);
  }),

  invoice: asyncHandler(async (req: Request, res: Response) => {
    const data = await challanService.getInvoiceData(req.params.id);
    generateInvoicePDF(res, data);
  }),
};
