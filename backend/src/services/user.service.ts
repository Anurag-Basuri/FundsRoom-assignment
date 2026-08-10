import bcrypt from 'bcrypt';
import { User } from '../models';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const userService = {
  async listUsers() {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    return users;
  },

  async createUser(data: { name: string; email: string; password: string; role: string }) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'A user with this email already exists');
    }

    const password_hash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password_hash,
      role: data.role as any,
    });

    return user.toSafeJSON();
  },

  async updateUser(id: string, data: Partial<{ name: string; email: string; role: string; is_active: boolean }>) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        throw new AppError(409, 'A user with this email already exists');
      }
    }

    await user.update(data as any);
    return user.toSafeJSON();
  },

  async deactivateUser(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await user.update({ is_active: false });
    return user.toSafeJSON();
  },
};
