import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { userService } from '../services/user.service';

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    apiResponse.success(res, users);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    apiResponse.created(res, user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body);
    apiResponse.success(res, user);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.deactivateUser(req.params.id);
    apiResponse.success(res, user);
  }),
};
