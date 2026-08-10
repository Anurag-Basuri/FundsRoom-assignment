import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Products from '../../src/pages/Products';
import { productApi } from '../../src/api/product.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/product.api', () => ({
  productApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

describe('Products Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders products list for Warehouse role', async () => {
    (productApi.list as any).mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Wireless Headphones',
          sku: 'WH-100',
          category: 'Electronics',
          unit_price: '1500',
          current_stock: 50,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '2', name: 'Warehouse User', email: 'w@w.com', role: 'Warehouse' } });

    renderWithClient(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
      expect(screen.getByText('WH-100')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('₹1,500')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Add Product')).toBeInTheDocument(); // Warehouse can add products
    });
  });

  it('hides Add Product button for Accounts role', async () => {
    (productApi.list as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '3', name: 'Accounts User', email: 'a@a.com', role: 'Accounts' } });

    renderWithClient(<Products />);

    await waitFor(() => {
      expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    (productApi.list as any).mockResolvedValue({
      data: [],
      meta: { total: 20, page: 1, limit: 10, totalPages: 2 },
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Products />);

    await waitFor(() => {
      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).toBeEnabled();
    });
  });
});
