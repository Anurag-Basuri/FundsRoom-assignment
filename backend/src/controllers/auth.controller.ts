import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { authService } from '../services/auth.service';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    apiResponse.success(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    apiResponse.success(res, result);
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // With stateless JWT, logout is handled client-side by discarding the tokens
    apiResponse.success(res, { message: 'Logged out successfully' });
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);
    apiResponse.success(res, user);
  }),
};
