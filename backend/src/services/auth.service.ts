import bcrypt from 'bcrypt';
import { User } from '../models';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

export const authService = {
  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.is_active) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const payload = { id: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        throw new AppError(401, 'User not found or deactivated');
      }

      const payload = { id: user.id, role: user.role };
      const newAccessToken = signAccessToken(payload);

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, 'Invalid refresh token');
    }
  },

  async getProfile(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user.toSafeJSON();
  },
};
