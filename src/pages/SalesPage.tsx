
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Edit, Trash2 } from 'lucide-react';

interface Sale {
  id: string;
  total_amount: number;
  created_at: string;
  payment_status: string | null;
  payment_method: string | null;
  customer_id: string | null;
  prescription_id: string | null;
}

interface Customer {
  id: string;
  full_name: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Record<string, Customer>>({});

  useEffect(() => {
    fetchSales();
    fetchCustomers();

    // Subscribe to changes
    const channel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchSales)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch sales', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name');

      if (error) throw error;
      
      const customersMap: Record<string, Customer> = {};
      data?.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      
      setCustomers(customersMap);
    } catch (error: any) {
      toast.error('Failed to fetch customers', { description: error.message });
    }
  };

  const filteredSales = sales.filter(sale => {
    const customerName = sale.customer_id ? customers[sale.customer_id]?.full_name.toLowerCase() : '';
    return customerName.includes(searchQuery.toLowerCase()) || 
           sale.payment_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sale.payment_method?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Sales</h1>
        <Button onClick={() => toast.info('Create sale functionality coming soon')} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>Sales History</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
              <p className="ml-2">Loading sales...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredSales.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No sales found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or add a new sale</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatDate(sale.created_at)}</TableCell>
                        <TableCell>INV-{sale.id.substring(0, 8)}</TableCell>
                        <TableCell>{sale.customer_id ? customers[sale.customer_id]?.full_name : 'Walk-in Customer'}</TableCell>
                        <TableCell>${sale.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                            sale.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {sale.payment_status || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => toast.info('View details coming soon')}>
                              View
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => toast.info('Delete functionality coming soon')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
