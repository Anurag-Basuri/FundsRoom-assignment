import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const restrictTo = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, `Access denied. Required roles: ${roles.join(', ')}`));
    }

    next();
  };
};
