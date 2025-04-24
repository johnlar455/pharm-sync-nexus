
import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, Clipboard, Calendar } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ExpiringSoon } from '@/components/dashboard/ExpiringSoon';
import { useToast } from '@/hooks/use-toast';

// Mock data for dashboard
const mockSalesData = {
  daily: Array.from({ length: 24 }, (_, i) => ({
    name: `${i}:00`,
    sales: Math.floor(Math.random() * 5000) + 1000,
    revenue: Math.floor(Math.random() * 8000) + 3000,
  })),
  weekly: Array.from({ length: 7 }, (_, i) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      name: days[i],
      sales: Math.floor(Math.random() * 20000) + 5000,
      revenue: Math.floor(Math.random() * 30000) + 15000,
    };
  }),
  monthly: Array.from({ length: 12 }, (_, i) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      name: months[i],
      sales: Math.floor(Math.random() * 100000) + 50000,
      revenue: Math.floor(Math.random() * 150000) + 80000,
    };
  }),
};

const mockLowStockItems = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    sku: 'MED-PAR-001',
    inStock: 15,
    threshold: 50,
    supplier: 'MediPharm Suppliers',
    price: 4.99,
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    sku: 'MED-AMX-002',
    inStock: 8,
    threshold: 40,
    supplier: 'Global Pharma Inc.',
    price: 12.50,
  },
  {
    id: '3',
    name: 'Loratadine 10mg',
    sku: 'MED-LOR-003',
    inStock: 25,
    threshold: 60,
    supplier: 'AllCure Distributors',
    price: 7.25,
  },
];

const mockExpiringItems = [
  {
    id: '1',
    name: 'Ibuprofen 400mg',
    batch: 'IBU-2023-05',
    expiryDate: '2025-06-15',
    daysLeft: 5,
    quantity: 120,
  },
  {
    id: '2',
    name: 'Cetirizine 10mg',
    batch: 'CET-2023-02',
    expiryDate: '2025-07-01',
    daysLeft: 22,
    quantity: 85,
  },
  {
    id: '3',
    name: 'Aspirin 75mg',
    batch: 'ASP-2023-08',
    expiryDate: '2025-08-10',
    daysLeft: 62,
    quantity: 200,
  },
];

const mockActivities = [
  {
    id: '1',
    type: 'sale' as const,
    title: 'New Sale Completed',
    description: 'John Doe purchased Paracetamol and Vitamin C',
    time: '5 mins ago',
    statusColor: 'success' as const,
    status: 'Completed',
  },
  {
    id: '2',
    type: 'inventory' as const,
    title: 'Inventory Updated',
    description: 'Received 200 units of Amoxicillin from supplier',
    time: '1 hour ago',
    statusColor: 'success' as const,
    status: 'Restocked',
  },
  {
    id: '3',
    type: 'prescription' as const,
    title: 'New Prescription',
    description: 'Dr. Smith prescribed medication for Sarah Johnson',
    time: '2 hours ago',
    statusColor: 'warning' as const,
    status: 'Pending',
  },
  {
    id: '4',
    type: 'user' as const,
    title: 'New Customer Registered',
    description: 'Emma Wilson created an account',
    time: '3 hours ago',
  },
  {
    id: '5',
    type: 'sale' as const,
    title: 'Refund Processed',
    description: 'Refund for invoice #1234 processed',
    time: '4 hours ago',
    statusColor: 'danger' as const,
    status: 'Refunded',
  },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleOrderMore = (itemId: string) => {
    const item = mockLowStockItems.find(item => item.id === itemId);
    
    if (item) {
      toast({
        title: 'Order Placed',
        description: `Order placed for ${item.name}`,
      });
    }
  };

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
      
      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Medicines" 
          value="1,256" 
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Customers" 
          value="3,862" 
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Today's Sales" 
          value="$4,892" 
          icon={ShoppingCart}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard 
          title="Pending Prescriptions" 
          value="24" 
          icon={Clipboard}
          trend={{ value: 2, isPositive: false }}
        />
      </div>
      
      {/* Charts & Reports */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={mockSalesData} />
        </div>
        <RecentActivity activities={mockActivities} />
      </div>
      
      {/* Inventory Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockAlert 
          items={mockLowStockItems} 
          onOrderMore={handleOrderMore} 
        />
        <ExpiringSoon items={mockExpiringItems} />
      </div>
      
      {/* Upcoming Events */}
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
