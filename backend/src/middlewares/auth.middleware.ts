import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { User } from '../models';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'is_active'],
    });

    if (!user || !user.is_active) {
      throw new AppError(401, 'User no longer exists or is deactivated');
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(401, 'Invalid or expired token'));
  }
};
