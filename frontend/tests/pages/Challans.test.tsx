import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Challans from '../../src/pages/Challans';
import { challanApi } from '../../src/api/challan.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/challan.api', () => ({
  challanApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  },
}));

// Mock ResizeObserver for Recharts (if used in Challans, or just in case)
if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('Challans Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders challans correctly for Admin', async () => {
    (challanApi.list as any).mockResolvedValue({
      data: [
        {
          id: '1',
          challan_number: 'CH-2023-0001',
          customer: { name: 'Acme Corp' },
          status: 'Draft',
          total_quantity: 15,
          total_amount: 15000,
          created_at: new Date().toISOString(),
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Challans />);

    await waitFor(() => {
      expect(screen.getByText('CH-2023-0001')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // quantity
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('Create Challan')).toBeInTheDocument(); // Admin can create
    });
  });

  it('hides Create Challan button for Accounts role', async () => {
    (challanApi.list as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    useAuthStore.setState({ user: { id: '3', name: 'Accounts User', email: 'a@a.com', role: 'Accounts' } });

    renderWithClient(<Challans />);

    await waitFor(() => {
      expect(screen.queryByText('Create Challan')).not.toBeInTheDocument();
    });
  });
});
