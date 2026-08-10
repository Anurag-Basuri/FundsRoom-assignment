import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../../src/pages/Login';
import { authApi } from '../../src/api/auth.api';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../src/store/authStore';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../src/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

  it('renders login form correctly', () => {
    renderComponent();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submission', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const mockUser = { id: '1', email: 'admin@fundsroom.com', role: 'Admin' };
    (authApi.login as any).mockResolvedValueOnce({
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'admin@fundsroom.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@fundsroom.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  it('handles failed login', async () => {
    (authApi.login as any).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'wrong@fundsroom.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
