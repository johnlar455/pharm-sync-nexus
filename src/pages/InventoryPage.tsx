
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Search, Plus, ArrowUp, ArrowDown, PlusCircle, MinusCircle, ClipboardList, AlertTriangle, Package as PackageIcon, FilterX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogClose } from '@radix-ui/react-dialog';
import { format, parseISO, isValid } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Medicine {
  id: string;
  name: string;
  stock_quantity: number;
  unit_price: number;
  reorder_level: number;
  expiry_date: string | null;
  category: string | null;
}

interface Transaction {
  id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  transaction_type: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  medicine?: {
    name: string;
  };
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionTab, setTransactionTab] = useState('all');
  const [medicineFilter, setMedicineFilter] = useState('all');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'stock-in' | 'stock-out'>('stock-in');
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    medicine_id: '',
    quantity: '',
    unit_price: '',
    total_amount: 0,
    transaction_type: 'stock-in',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchMedicines();
    fetchTransactions();

    // Subscribe to changes
    const medicinesChannel = supabase
      .channel('inventory-medicines-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, fetchMedicines)
      .subscribe();

    const transactionsChannel = supabase
      .channel('inventory-transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, fetchTransactions)
      .subscribe();

    return () => {
      supabase.removeChannel(medicinesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  useEffect(() => {
    // Filter medicines
    let filtered = [...medicines];
    
    if (medicineSearchQuery) {
      const query = medicineSearchQuery.toLowerCase();
      filtered = filtered.filter(medicine => 
        medicine.name.toLowerCase().includes(query) || 
        medicine.category?.toLowerCase().includes(query)
      );
    }
    
    if (medicineFilter === 'low-stock') {
      filtered = filtered.filter(medicine => medicine.stock_quantity <= medicine.reorder_level);
    }
    else if (medicineFilter === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(medicine => 
        medicine.expiry_date !== null && medicine.expiry_date < today
      );
    }
    else if (medicineFilter === 'expiring-soon') {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const thirtyDaysISO = thirtyDaysFromNow.toISOString().split('T')[0];
      const todayISO = today.toISOString().split('T')[0];
      
      filtered = filtered.filter(medicine => 
        medicine.expiry_date !== null && 
        medicine.expiry_date > todayISO && 
        medicine.expiry_date <= thirtyDaysISO
      );
    }
    
    setFilteredMedicines(filtered);
  }, [medicines, medicineSearchQuery, medicineFilter]);

  useEffect(() => {
    // Filter transactions
    let filtered = [...transactions];
    
    if (transactionSearchQuery) {
      const query = transactionSearchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.medicine?.name.toLowerCase().includes(query) || 
        transaction.reference_number?.toLowerCase().includes(query) || 
        transaction.notes?.toLowerCase().includes(query)
      );
    }
    
    if (transactionTab !== 'all') {
      filtered = filtered.filter(transaction => transaction.transaction_type === transactionTab);
    }
    
    // Sort by date, newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setFilteredTransactions(filtered);
  }, [transactions, transactionSearchQuery, transactionTab]);

  useEffect(() => {
    // Update total amount when quantity or unit price changes
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    setFormData(prev => ({
      ...prev,
      total_amount: Number((quantity * unitPrice).toFixed(2))
    }));
  }, [formData.quantity, formData.unit_price]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, stock_quantity, unit_price, reorder_level, expiry_date, category');

      if (error) throw error;
      
      setMedicines(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch medicines', { 
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          id, 
          medicine_id,
          quantity,
          unit_price,
          total_amount,
          transaction_type,
          reference_number,
          notes,
          created_at,
          medicine:medicine_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to most recent 100 transactions

      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch transactions', { 
        description: error.message
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'medicine_id' && value) {
      const selectedMed = medicines.find(m => m.id === value);
      if (selectedMed) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          unit_price: String(selectedMed.unit_price)
        }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.medicine_id) {
      toast.error('Please select a medicine');
      return false;
    }

    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      toast.error('Quantity must be a positive number');
      return false;
    }

    if (!formData.unit_price || isNaN(Number(formData.unit_price)) || Number(formData.unit_price) < 0) {
      toast.error('Unit price must be a non-negative number');
      return false;
    }

    return true;
  };

  const handleAddTransaction = async () => {
    if (!validateForm()) return;

    try {
      // Fix: Ensure all required fields are provided and not optional
      const newTransaction = {
        medicine_id: formData.medicine_id,
        quantity: Number(formData.quantity), // Required
        unit_price: Number(formData.unit_price), // Required
        total_amount: formData.total_amount, // Required
        transaction_type: transactionType,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null
      };

      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(newTransaction);

      if (transactionError) throw transactionError;
      
      // Update medicine stock
      const medicine = medicines.find(m => m.id === formData.medicine_id);
      if (!medicine) throw new Error('Medicine not found');
      
      let newQuantity = medicine.stock_quantity;
      if (transactionType === 'stock-in') {
        newQuantity += Number(formData.quantity);
      } else {
        newQuantity -= Number(formData.quantity);
        if (newQuantity < 0) {
          toast.error('Cannot reduce stock below zero');
          return;
        }
      }
      
      const { error: updateError } = await supabase
        .from('medicines')
        .update({ stock_quantity: newQuantity })
        .eq('id', formData.medicine_id);
      
      if (updateError) throw updateError;
      
      toast.success(`${transactionType === 'stock-in' ? 'Stock added' : 'Stock removed'} successfully`);
      setOpenAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to process transaction', { 
        description: error.message 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      medicine_id: '',
      quantity: '',
      unit_price: '',
      total_amount: 0,
      transaction_type: 'stock-in',
      reference_number: '',
      notes: ''
    });
  };

  const openAddTransactionDialog = (type: 'stock-in' | 'stock-out') => {
    setTransactionType(type);
    resetForm();
    setOpenAddDialog(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const resetMedicineFilters = () => {
    setMedicineSearchQuery('');
    setMedicineFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
          <Button onClick={() => openAddTransactionDialog('stock-in')}>
            <ArrowDown className="mr-2 h-4 w-4" /> Stock In
          </Button>
          <Button variant="outline" onClick={() => openAddTransactionDialog('stock-out')}>
            <ArrowUp className="mr-2 h-4 w-4" /> Stock Out
          </Button>
        </div>
      </div>
      
      {/* Medicines stock levels card */}
      <Card>
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="flex items-center">
            <PackageIcon className="mr-2 h-5 w-5 text-pharmacy-600" />
            <span>Medicine Stock Levels</span>
          </CardTitle>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                className="pl-8" 
                placeholder="Search medicines..." 
                value={medicineSearchQuery}
                onChange={(e) => setMedicineSearchQuery(e.target.value)}
              />
            </div>
            <Select value={medicineFilter} onValueChange={setMedicineFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All medicines</SelectItem>
                <SelectItem value="low-stock">Low stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring-soon">Expiring soon</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetMedicineFilters} className="flex-shrink-0">
              <FilterX className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
              <p className="ml-2">Loading medicines...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredMedicines.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No medicines found</p>
                  <p className="text-sm text-muted-foreground">
                    {medicineFilter !== 'all' ? 'Try changing your filter' : 'Add medicines to see them here'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicines.map((medicine) => {
                      const isLowStock = medicine.stock_quantity <= medicine.reorder_level;
                      const isExpired = medicine.expiry_date ? new Date(medicine.expiry_date) < new Date() : false;
                      const isExpiringSoon = medicine.expiry_date ? 
                        (new Date(medicine.expiry_date) > new Date() && 
                        new Date(medicine.expiry_date) <= new Date(new Date().setDate(new Date().getDate() + 30))) 
                        : false;
                      
                      return (
                        <TableRow key={medicine.id}>
                          <TableCell className="font-medium">{medicine.name}</TableCell>
                          <TableCell>{medicine.category || '-'}</TableCell>
                          <TableCell>{medicine.stock_quantity}</TableCell>
                          <TableCell>${medicine.unit_price.toFixed(2)}</TableCell>
                          <TableCell>${(medicine.stock_quantity * medicine.unit_price).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {isLowStock && (
                                <Badge variant="destructive">
                                  Low Stock
                                </Badge>
                              )}
                              {isExpired && (
                                <Badge variant="destructive">
                                  Expired
                                </Badge>
                              )}
                              {isExpiringSoon && !isExpired && (
                                <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-700">
                                  Expiring Soon
                                </Badge>
                              )}
                              {!isLowStock && !isExpired && !isExpiringSoon && (
                                <Badge variant="outline" className="border-green-400 bg-green-50 text-green-700">
                                  Good
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transaction History Card */}
      <Card>
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-pharmacy-600" />
            <span>Transaction History</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8" 
              placeholder="Search transactions..." 
              value={transactionSearchQuery}
              onChange={(e) => setTransactionSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={transactionTab} onValueChange={setTransactionTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="stock-in">Stock In</TabsTrigger>
              <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
            </TabsList>
            
            {transactionsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
                <p className="ml-2">Loading transactions...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm text-muted-foreground">Add stock movement transactions to see them here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.medicine?.name || 'Unknown Medicine'}</TableCell>
                          <TableCell>
                            {transaction.transaction_type === 'stock-in' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <PlusCircle className="mr-1 h-3 w-3" /> Stock In
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <MinusCircle className="mr-1 h-3 w-3" /> Stock Out
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>${transaction.unit_price.toFixed(2)}</TableCell>
                          <TableCell>${transaction.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{transaction.reference_number || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Transaction Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'stock-in' ? 'Add Stock' : 'Remove Stock'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medicine">Medicine*</Label>
              <Select 
                name="medicine_id" 
                value={formData.medicine_id} 
                onValueChange={(value) => handleSelectChange('medicine_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map(medicine => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.name} ({medicine.stock_quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity*</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  min="1" 
                  placeholder="0"
                  value={formData.quantity} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price*</Label>
                <Input 
                  id="unit_price" 
                  name="unit_price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00"
                  value={formData.unit_price} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input 
                id="reference" 
                name="reference_number" 
                placeholder="Invoice or batch number" 
                value={formData.reference_number} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Additional details about this transaction" 
                value={formData.notes} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
                <span className="font-semibold">Total Value:</span>
                <span className="text-lg font-bold">${formData.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTransaction}>
              {transactionType === 'stock-in' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
