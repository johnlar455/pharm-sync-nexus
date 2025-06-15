
import { Package, AlertTriangle, Calendar, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ExpiringSoon } from '@/components/dashboard/ExpiringSoon';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your pharmacy operations</p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Medicines" 
          value={stats.totalMedicines.toString()} 
          icon={Package}
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStockCount.toString()} 
          icon={AlertTriangle}
          className="bg-orange-50"
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats.expiringCount.toString()} 
          icon={Calendar}
          className="bg-yellow-50"
        />
        <StatCard 
          title="Today's Sales" 
          value={`$${stats.todaySales.toFixed(2)}`} 
          icon={ShoppingCart}
          className="bg-green-50"
        />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 shadow">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <RecentActivity activities={stats.recentActivity} />
        </div>
        
        <div className="rounded-lg border bg-card p-4 shadow">
          <h2 className="mb-4 font-semibold">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
              <span className="text-sm text-green-700">Medicines in Stock</span>
              <span className="font-semibold text-green-800">{stats.totalMedicines}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-md">
              <span className="text-sm text-orange-700">Low Stock Alerts</span>
              <span className="font-semibold text-orange-800">{stats.lowStockCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
              <span className="text-sm text-yellow-700">Expiring Items</span>
              <span className="font-semibold text-yellow-800">{stats.expiringCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
