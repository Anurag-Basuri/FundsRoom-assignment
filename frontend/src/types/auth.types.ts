import { User } from '../store/authStore';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type UserProfile = User;
