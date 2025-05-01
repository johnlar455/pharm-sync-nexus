
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { FileText, Search, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string | null;
  created_at: string;
  due_date: string | null;
  customer_id: string | null;
}

interface Customer {
  id: string;
  full_name: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Record<string, Customer>>({});

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();

    // Subscribe to changes
    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchInvoices)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch invoices', { description: error.message });
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

  const filteredInvoices = invoices.filter(invoice => {
    const customerName = invoice.customer_id ? customers[invoice.customer_id]?.full_name.toLowerCase() : '';
    return invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
           customerName.includes(searchQuery.toLowerCase()) ||
           (invoice.status && invoice.status.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'PP');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch(status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => toast.info('Create invoice functionality coming soon')} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>All Invoices</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search invoices..."
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
              <p className="ml-2">Loading invoices...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredInvoices.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or create a new invoice</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.created_at)}</TableCell>
                        <TableCell>{invoice.customer_id ? customers[invoice.customer_id]?.full_name : 'Walk-in Customer'}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => toast.info('View invoice details coming soon')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toast.info('Print functionality coming soon')}>
                              <FileText className="h-4 w-4" />
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
