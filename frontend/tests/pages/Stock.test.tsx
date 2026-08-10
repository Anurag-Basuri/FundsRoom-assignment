import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stock from '../../src/pages/Stock';
import { stockApi } from '../../src/api/stock.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/stock.api', () => ({
  stockApi: {
    listMovements: vi.fn(),
    createMovement: vi.fn(),
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

describe('Stock Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders stock movements correctly', async () => {
    (stockApi.listMovements as any).mockResolvedValue({
      data: [
        {
          id: '1',
          product: { name: 'Wireless Headphones', sku: 'WH-100' },
          quantity_changed: 20,
          movement_type: 'IN',
          reason: 'Restock',
          created_at: new Date().toISOString(),
          creator: { name: 'Admin User' },
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Stock />);

    await waitFor(() => {
      expect(screen.getByText(/Wireless Headphones/)).toBeInTheDocument();
      expect(screen.getByText(/WH-100/)).toBeInTheDocument();
      expect(screen.getByText('IN')).toBeInTheDocument();
      expect(screen.getByText('+20')).toBeInTheDocument();
      expect(screen.getByText('Restock')).toBeInTheDocument();
      expect(screen.getByText('Record Movement')).toBeInTheDocument(); // Admin can record
    });
  });

  it('hides Record Movement button for Sales role', async () => {
    (stockApi.listMovements as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '4', name: 'Sales User', email: 's@s.com', role: 'Sales' } });

    renderWithClient(<Stock />);

    await waitFor(() => {
      expect(screen.queryByText('Record Movement')).not.toBeInTheDocument();
    });
  });
});
