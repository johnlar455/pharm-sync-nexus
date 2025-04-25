
import { Package, AlertTriangle, Calendar, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ExpiringSoon } from '@/components/dashboard/ExpiringSoon';
import { useDashboardData } from '@/hooks/useDashboardData';

// Mock data for development
const mockSalesData = {
  daily: Array.from({ length: 7 }, (_, i) => ({
    name: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
    sales: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 5000) + 1000,
  })).reverse(),
  weekly: Array.from({ length: 4 }, (_, i) => ({
    name: `Week ${i + 1}`,
    sales: Math.floor(Math.random() * 200) + 50,
    revenue: Math.floor(Math.random() * 20000) + 5000,
  })),
  monthly: Array.from({ length: 6 }, (_, i) => ({
    name: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
    sales: Math.floor(Math.random() * 500) + 100,
    revenue: Math.floor(Math.random() * 50000) + 10000,
  })).reverse(),
};

const mockLowStockItems = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    sku: 'MED-PARA-500',
    inStock: 8,
    threshold: 20,
    supplier: 'ABC Pharma',
    price: 5.99
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    sku: 'MED-AMOX-250',
    inStock: 5,
    threshold: 15,
    supplier: 'XYZ Medical',
    price: 12.50
  }
];

const mockExpiringItems = [
  {
    id: '1',
    name: 'Vitamin C 1000mg',
    batch: 'VC1000-B12',
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    daysLeft: 15,
    quantity: 30
  },
  {
    id: '2',
    name: 'Aspirin 75mg',
    batch: 'ASP75-B45',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    daysLeft: 7,
    quantity: 50
  }
];

const mockActivities = [
  {
    id: '1',
    type: 'sale' as const,
    title: 'New Sale Completed',
    description: 'Sale to John Doe - $125.99',
    time: '10 minutes ago',
    status: 'Completed',
    statusColor: 'success' as const
  },
  {
    id: '2',
    type: 'inventory' as const,
    title: 'Inventory Updated',
    description: 'Received 200 units of Paracetamol',
    time: '2 hours ago',
    status: 'Processed',
    statusColor: 'success' as const
  }
];

// Handler for low stock items
const handleOrderMore = (itemId: string) => {
  console.log(`Ordering more of item ${itemId}`);
  // In a real app, this would open a form or modal to place an order
};

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
