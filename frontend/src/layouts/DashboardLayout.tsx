import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Package, ArrowRightLeft, FileText, LogOut } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  
  // Initialize global socket connection for authenticated user
  useSocket();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['Admin', 'Sales', 'Accounts'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['Admin', 'Warehouse', 'Sales', 'Accounts'] },
    { name: 'Stock', href: '/stock', icon: ArrowRightLeft, roles: ['Admin', 'Warehouse', 'Accounts'] },
    { name: 'Challans', href: '/challans', icon: FileText, roles: ['Admin', 'Sales', 'Accounts'] },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center justify-center border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider">ERP + CRM</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            if (item.roles && !item.roles.includes(user?.role as string)) return null;
            
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3">
              <span className="text-sm font-medium">{user?.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-slate-800" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
