import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { reportService } from '../services/report.service';

export const dashboardController = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await reportService.getDashboardSummary(req.user!.role, req.user!.id);
    apiResponse.success(res, summary);
  }),
};
