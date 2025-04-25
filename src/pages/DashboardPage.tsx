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
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={mockSalesData} />
        </div>
        <RecentActivity activities={mockActivities} />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockAlert 
          items={mockLowStockItems} 
          onOrderMore={handleOrderMore} 
        />
        <ExpiringSoon items={mockExpiringItems} />
      </div>
      
      <div className="rounded-lg border bg-card p-4 shadow">
        <div className="mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-pharmacy-600" />
          <h2 className="font-semibold">Upcoming Deliveries</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-md border p-3">
              <p className="font-medium">Delivery #{1000 + item}</p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Global Pharma Inc.</span>
                <span className="font-medium text-pharmacy-600">Tomorrow</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Contains: Antibiotics, Pain relievers
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
