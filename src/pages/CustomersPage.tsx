
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { DialogClose } from '@radix-ui/react-dialog';

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();

    // Subscribe to changes
    const channel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.full_name.toLowerCase().includes(query) || 
        (customer.email && customer.email.toLowerCase().includes(query)) || 
        (customer.phone && customer.phone.toLowerCase().includes(query)) ||
        (customer.address && customer.address.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchQuery]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name');

      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch customers', { 
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.full_name.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    return true;
  };

  const handleAddCustomer = async () => {
    if (!validateForm()) return;

    try {
      const newCustomer = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null
      };

      const { error } = await supabase
        .from('customers')
        .insert(newCustomer);

      if (error) throw error;
      
      toast.success('Customer added successfully');
      setOpenAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add customer', { 
        description: error.message 
      });
    }
  };

  const handleEditCustomer = async () => {
    if (!validateForm() || !selectedCustomer) return;

    try {
      const updatedCustomer = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null
      };

      const { error } = await supabase
        .from('customers')
        .update(updatedCustomer)
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      
      toast.success('Customer updated successfully');
      setOpenEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to update customer', { 
        description: error.message 
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      
      toast.success('Customer deleted successfully');
      setOpenDeleteDialog(false);
    } catch (error: any) {
      toast.error('Failed to delete customer', { 
        description: error.message 
      });
    }
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setOpenEditDialog(true);
  };

  const openDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => { resetForm(); setOpenAddDialog(true); }} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>All Customers</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search customers..."
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
              <p className="ml-2">Loading customers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredCustomers.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No customers found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or add a new customer</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.full_name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.address || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDelete(customer)}>
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

      {/* Add Customer Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name*</Label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full_name">Full Name*</Label>
              <Input id="edit-full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditCustomer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete {selectedCustomer?.full_name}?</p>
            <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteCustomer}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
