
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

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_number: ''
  });

  useEffect(() => {
    fetchSuppliers();

    // Subscribe to changes
    const channel = supabase
      .channel('suppliers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, fetchSuppliers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = suppliers.filter(supplier => 
        supplier.company_name.toLowerCase().includes(query) || 
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(query)) || 
        (supplier.email && supplier.email.toLowerCase().includes(query)) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(query))
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [suppliers, searchQuery]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name');

      if (error) throw error;
      
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch suppliers', { 
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
    if (!formData.company_name || !formData.company_name.trim()) {
      toast.error('Company name is required');
      return false;
    }
    return true;
  };

  const handleAddSupplier = async () => {
    if (!validateForm()) return;

    try {
      const newSupplier = {
        company_name: formData.company_name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null
      };

      const { error } = await supabase
        .from('suppliers')
        .insert(newSupplier);

      if (error) throw error;
      
      toast.success('Supplier added successfully');
      setOpenAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add supplier', { 
        description: error.message 
      });
    }
  };

  const handleEditSupplier = async () => {
    if (!validateForm() || !selectedSupplier) return;

    try {
      const updatedSupplier = {
        company_name: formData.company_name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null
      };

      const { error } = await supabase
        .from('suppliers')
        .update(updatedSupplier)
        .eq('id', selectedSupplier.id);

      if (error) throw error;
      
      toast.success('Supplier updated successfully');
      setOpenEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to update supplier', { 
        description: error.message 
      });
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', selectedSupplier.id);

      if (error) throw error;
      
      toast.success('Supplier deleted successfully');
      setOpenDeleteDialog(false);
    } catch (error: any) {
      toast.error('Failed to delete supplier', { 
        description: error.message 
      });
    }
  };

  const openEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      company_name: supplier.company_name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      tax_number: supplier.tax_number || ''
    });
    setOpenEditDialog(true);
  };

  const openDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      tax_number: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button onClick={() => { resetForm(); setOpenAddDialog(true); }} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>All Suppliers</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search suppliers..."
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
              <p className="ml-2">Loading suppliers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredSuppliers.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No suppliers found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or add a new supplier</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>{supplier.company_name}</TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(supplier)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDelete(supplier)}>
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

      {/* Add Supplier Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name*</Label>
              <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
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
            <div className="space-y-2">
              <Label htmlFor="tax_number">Tax Number</Label>
              <Input id="tax_number" name="tax_number" value={formData.tax_number} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_company_name">Company Name*</Label>
              <Input id="edit_company_name" name="company_name" value={formData.company_name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_contact_person">Contact Person</Label>
              <Input id="edit_contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input id="edit_email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input id="edit_phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Input id="edit_address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_tax_number">Tax Number</Label>
              <Input id="edit_tax_number" name="tax_number" value={formData.tax_number} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditSupplier}>Save Changes</Button>
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
            <p>Are you sure you want to delete {selectedSupplier?.company_name}?</p>
            <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteSupplier}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
