
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Filter, ArrowDown, ArrowUp, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Medicine {
  id: string;
  name: string;
  stock_quantity: number;
  unit_price: number;
  category: string | null;
  expiry_date: string | null;
}

interface InventoryTransaction {
  id: string;
  medicine_id: string;
  medicine_name?: string; // Will be joined from medicine table
  quantity: number;
  unit_price: number;
  total_amount: number;
  transaction_type: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

// Schema for inventory transaction
const inventoryTransactionSchema = z.object({
  medicine_id: z.string().min(1, { message: "Medicine is required" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  unit_price: z.number().min(0, { message: "Price cannot be negative" }),
  transaction_type: z.string().min(1, { message: "Transaction type is required" }),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [lowStockItems, setLowStockItems] = useState<Medicine[]>([]);
  const [expiringItems, setExpiringItems] = useState<Medicine[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize form for adding inventory transactions
  const form = useForm<z.infer<typeof inventoryTransactionSchema>>({
    resolver: zodResolver(inventoryTransactionSchema),
    defaultValues: {
      medicine_id: "",
      quantity: 1,
      unit_price: 0,
      transaction_type: "in",
      reference_number: "",
      notes: "",
    },
  });

  // Check user role on component mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin' && profile?.role !== 'pharmacist') {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    checkUserRole();
  }, [navigate, toast]);

  // Fetch medicines data
  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setMedicines(data as Medicine[]);
      
      // Get low stock items
      const today = new Date().toISOString().split('T')[0];
      const { data: lowStock } = await supabase
        .from('medicines')
        .select('*')
        .lt('stock_quantity', 10) // Using a fixed reorder level
        .order('stock_quantity');
      
      if (lowStock) setLowStockItems(lowStock as Medicine[]);
      
      // Get expiring items
      const { data: expiring } = await supabase
        .from('medicines')
        .select('*')
        .lt('expiry_date', today)
        .order('expiry_date');
        
      if (expiring) setExpiringItems(expiring as Medicine[]);
      
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Failed to load medicines data",
        variant: "destructive",
      });
    }
  };

  // Fetch inventory transactions
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          medicines:medicine_id (name)
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      if (data) {
        // Transform data to include medicine name
        const transformedData = data.map(item => ({
          ...item,
          medicine_name: item.medicines?.name || 'Unknown',
        }));
        
        setTransactions(transformedData as InventoryTransaction[]);
      }
    } catch (error) {
      toast({
        title: "Error fetching transactions",
        description: "Failed to load inventory transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchTransactions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_transactions'
      }, () => fetchTransactions())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medicines'
      }, () => fetchMedicines())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter transactions based on search query and transaction type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = transactionTypeFilter === 'all' || 
      transaction.transaction_type === transactionTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Open dialog to add new transaction
  const openAddTransactionDialog = () => {
    form.reset();
    setDialogOpen(true);
  };

  // Handle form submission for new transaction
  const onSubmit = async (values: z.infer<typeof inventoryTransactionSchema>) => {
    try {
      // Get selected medicine details
      const selectedMedicine = medicines.find(med => med.id === values.medicine_id);
      
      if (!selectedMedicine) {
        toast({
          title: "Error",
          description: "Selected medicine not found",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate total amount
      const totalAmount = values.quantity * values.unit_price;
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
          ...values,
          total_amount: totalAmount
        });

      if (transactionError) throw transactionError;
      
      // Update medicine stock quantity
      const newQuantity = values.transaction_type === 'in' 
        ? selectedMedicine.stock_quantity + values.quantity
        : selectedMedicine.stock_quantity - values.quantity;
      
      // Prevent negative stock
      if (newQuantity < 0) {
        toast({
          title: "Insufficient stock",
          description: "Cannot remove more items than available in stock",
          variant: "destructive",
        });
        return;
      }
      
      const { error: updateError } = await supabase
        .from('medicines')
        .update({ stock_quantity: newQuantity })
        .eq('id', values.medicine_id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Transaction recorded",
        description: `${values.quantity} units ${values.transaction_type === 'in' ? 'added to' : 'removed from'} inventory`,
      });
      
      setDialogOpen(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
        <p className="ml-2">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock movements</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Report Generated", description: "Inventory report has been generated" })}>
            <FileText className="mr-2 h-4 w-4" />
            Report
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Export Started", description: "Inventory data export has started" })}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={openAddTransactionDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Record Transaction
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={transactionTypeFilter}
                onValueChange={setTransactionTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center"
                      onClick={() => handleSort('created_at')}
                    >
                      Date
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center"
                      onClick={() => handleSort('medicines.name')}
                    >
                      Medicine
                      {sortField === 'medicines.name' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell className="font-medium">{transaction.medicine_name}</TableCell>
                      <TableCell>
                        {transaction.transaction_type === 'in' ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Stock In</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Stock Out</Badge>
                        )}
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{formatPrice(transaction.unit_price)}</TableCell>
                      <TableCell>{formatPrice(transaction.total_amount)}</TableCell>
                      <TableCell>{transaction.reference_number || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{transaction.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Low Stock Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Badge variant="destructive" className="mr-2">Alert</Badge>
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-center text-muted-foreground">No low stock items</p>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category || 'Uncategorized'}</TableCell>
                            <TableCell>{item.stock_quantity}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  form.reset({
                                    medicine_id: item.id,
                                    quantity: 10,
                                    unit_price: item.unit_price,
                                    transaction_type: "in",
                                    reference_number: "",
                                    notes: "Restocking low inventory",
                                  });
                                  setDialogOpen(true);
                                }}
                              >
                                Restock
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Expiring Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Badge variant="destructive" className="mr-2">Alert</Badge>
                  Expired Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringItems.length === 0 ? (
                  <p className="text-center text-muted-foreground">No expired items</p>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiringItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{new Date(item.expiry_date!).toLocaleDateString()}</TableCell>
                            <TableCell>{item.stock_quantity}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-red-50 hover:bg-red-100 text-red-600"
                                onClick={() => {
                                  form.reset({
                                    medicine_id: item.id,
                                    quantity: item.stock_quantity,
                                    unit_price: 0,
                                    transaction_type: "out",
                                    reference_number: "",
                                    notes: "Removing expired product",
                                  });
                                  setDialogOpen(true);
                                }}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Inventory Transaction</DialogTitle>
            <DialogDescription>
              Add stock movement in or out of inventory
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Stock In</SelectItem>
                        <SelectItem value="out">Stock Out</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="medicine_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedMed = medicines.find(med => med.id === value);
                        if (selectedMed) {
                          form.setValue('unit_price', selectedMed.unit_price);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {medicines.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name} ({med.stock_quantity} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice or PO number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
