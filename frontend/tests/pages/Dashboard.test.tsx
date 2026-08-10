import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../../src/pages/Dashboard';
import { dashboardApi } from '../../src/api/dashboard.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/dashboard.api', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
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

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('shows loading state initially', () => {
    (dashboardApi.getSummary as any).mockReturnValue(new Promise(() => {}));
    useAuthStore.setState({ user: { id: '1', name: 'Admin', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Dashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders dashboard KPIs correctly for Admin', async () => {
    (dashboardApi.getSummary as any).mockResolvedValue({
      summary: {
        totalCustomers: 120,
        totalProducts: 45,
        lowStockCount: 3,
        revenueThisMonth: 50000,
      },
      recentChallans: [
        { id: '1', challan_number: 'CH-1001', customer: { name: 'Test Cust' }, total_amount: 1500 },
      ],
    });

    useAuthStore.setState({ user: { id: '1', name: 'Admin User', email: 'a@a.com', role: 'Admin' } });

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User/)).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument(); // totalCustomers
      expect(screen.getByText('45')).toBeInTheDocument(); // totalProducts
      expect(screen.getByText('3')).toBeInTheDocument(); // lowStockCount
      expect(screen.getByText('₹50,000')).toBeInTheDocument(); // revenueThisMonth
      expect(screen.getByText('Recent Challans')).toBeInTheDocument();
      expect(screen.getByText('CH-1001')).toBeInTheDocument();
      expect(screen.getByText('₹1,500')).toBeInTheDocument();
    });
  });

  it('hides revenue for Warehouse role', async () => {
    (dashboardApi.getSummary as any).mockResolvedValue({
      summary: {
        totalCustomers: 120,
        totalProducts: 45,
        lowStockCount: 3,
        revenueThisMonth: 50000,
      },
      recentChallans: [],
    });

    useAuthStore.setState({ user: { id: '2', name: 'Warehouse User', email: 'w@w.com', role: 'Warehouse' } });

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Warehouse User/)).toBeInTheDocument();
      expect(screen.queryByText('Revenue This Month')).not.toBeInTheDocument();
      expect(screen.queryByText('₹50,000')).not.toBeInTheDocument();
      expect(screen.queryByText('Recent Challans')).not.toBeInTheDocument(); // only admin
    });
  });
});
