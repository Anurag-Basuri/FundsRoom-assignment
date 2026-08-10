import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Customers from '../../src/pages/Customers';
import { customerApi } from '../../src/api/customer.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/customer.api', () => ({
  customerApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFollowUps: vi.fn(),
    addFollowUp: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('Customers Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('shows loading state initially', () => {
    (customerApi.list as any).mockReturnValue(new Promise(() => {}));
    useAuthStore.setState({ user: { id: '1', name: 'Admin', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Customers />);
    expect(screen.getByText('Loading customers...')).toBeInTheDocument();
  });

  it('renders customers list and displays Add Customer button for Admin', async () => {
    (customerApi.list as any).mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Rajesh Kumar',
          business_name: 'Kumar Traders',
          mobile: '9876543210',
          customer_type: 'Wholesale',
          status: 'Active',
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Customers />);

    await waitFor(() => {
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.getByText('Kumar Traders')).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
      expect(screen.getByText('Wholesale')).toBeInTheDocument();
      expect(screen.getByText('Add Customer')).toBeInTheDocument(); // Since role is Admin
    });
  });

  it('hides Add Customer button for Warehouse role', async () => {
    (customerApi.list as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '2', name: 'Warehouse User', email: 'w@w.com', role: 'Warehouse' } });

    renderWithClient(<Customers />);

    await waitFor(() => {
      expect(screen.queryByText('Add Customer')).not.toBeInTheDocument();
    });
  });

  it('displays no customers found message', async () => {
    (customerApi.list as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Customers />);

    await waitFor(() => {
      expect(screen.getByText('No customers found.')).toBeInTheDocument();
    });
  });
});
