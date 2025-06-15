
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, TrendingDown, AlertTriangle, Plus } from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  generic_name: string;
  stock_quantity: number;
  reorder_level: number;
  unit_price: number;
  expiry_date: string;
  category: string;
  manufacturer: string;
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', searchTerm, filter],
    queryFn: async () => {
      let query = supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as InventoryItem[];

      if (filter === 'low_stock') {
        filteredData = filteredData.filter(item => item.stock_quantity <= item.reorder_level);
      } else if (filter === 'expiring') {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        filteredData = filteredData.filter(item => 
          item.expiry_date && new Date(item.expiry_date) <= oneMonthFromNow
        );
      }

      return filteredData;
    },
  });

  const getStockBadge = (item: InventoryItem) => {
    if (item.stock_quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.stock_quantity <= item.reorder_level) {
      return <Badge variant="default">Low Stock</Badge>;
    }
    return <Badge variant="secondary">In Stock</Badge>;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return expiry <= oneMonthFromNow;
  };

  const lowStockCount = inventory.filter(item => item.stock_quantity <= item.reorder_level).length;
  const expiringCount = inventory.filter(item => 
    item.expiry_date && isExpiringSoon(item.expiry_date)
  ).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.stock_quantity * item.unit_price), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <Button className="bg-pharmacy-600 hover:bg-pharmacy-700">
          <Plus className="w-4 h-4 mr-2" />
          Restock Items
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Items
          </Button>
          <Button
            variant={filter === 'low_stock' ? 'default' : 'outline'}
            onClick={() => setFilter('low_stock')}
          >
            Low Stock
          </Button>
          <Button
            variant={filter === 'expiring' ? 'default' : 'outline'}
            onClick={() => setFilter('expiring')}
          >
            Expiring Soon
          </Button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                {getStockBadge(item)}
              </div>
              {item.generic_name && (
                <p className="text-sm text-gray-600">{item.generic_name}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Stock:</span>
                  <div className={`font-bold ${item.stock_quantity <= item.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock_quantity} units
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Reorder Level:</span>
                  <div className="font-medium">{item.reorder_level}</div>
                </div>
                <div>
                  <span className="text-gray-600">Unit Price:</span>
                  <div className="font-medium">${item.unit_price}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <div className="font-medium">${(item.stock_quantity * item.unit_price).toFixed(2)}</div>
                </div>
              </div>
              
              {item.expiry_date && (
                <div className="text-sm">
                  <span className="text-gray-600">Expiry Date:</span>
                  <div className={`font-medium ${isExpiringSoon(item.expiry_date) ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(item.expiry_date).toLocaleDateString()}
                    {isExpiringSoon(item.expiry_date) && (
                      <AlertTriangle className="inline w-4 h-4 ml-1" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding medicines to your inventory.'}
          </p>
        </div>
      )}
    </div>
  );
}
