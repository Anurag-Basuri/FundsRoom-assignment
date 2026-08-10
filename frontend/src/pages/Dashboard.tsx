import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, AlertTriangle, FileText, IndianRupee } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (!dashboardData) return <div>Failed to load dashboard</div>;

  const { summary, roleSpecific, recentChallans } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Common KPIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Catalog</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.lowStockCount}</div>
          </CardContent>
        </Card>

        {(user?.role === 'Admin' || user?.role === 'Accounts' || user?.role === 'Sales') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{summary.revenueThisMonth.toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role specific sections can go here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for chart or list */}
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md">
              Activity Chart / List coming here based on role
            </div>
          </CardContent>
        </Card>
        
        {user?.role === 'Admin' && recentChallans && (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Challans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentChallans.map((challan) => (
                  <div key={challan.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{challan.challan_number}</p>
                      <p className="text-xs text-muted-foreground">{challan.customer?.name}</p>
                    </div>
                    <div className="text-sm font-medium">₹{Number(challan.total_amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
