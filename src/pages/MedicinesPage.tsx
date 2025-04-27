
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, ChevronUp, ChevronDown, FilterX, Calendar } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { format, isValid, parseISO } from 'date-fns';
import { DialogClose } from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';

interface Medicine {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  expiry_date: string | null;
  category: string | null;
  manufacturer: string | null;
  generic_name: string | null;
  created_at: string;
  updated_at: string;
}

const categories = [
  'Analgesics', 
  'Antibiotics', 
  'Antihistamines', 
  'Cardiovascular', 
  'Dermatological',
  'Gastrointestinal',
  'Hormonal',
  'Respiratory',
  'Supplements',
  'Other'
];

export default function MedicinesPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Medicine>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit_price: '',
    category: '',
    description: '',
    expiry_date: '',
    manufacturer: '',
    stock_quantity: '',
    reorder_level: '10',
    generic_name: ''
  });

  useEffect(() => {
    fetchMedicines();

    // Subscribe to changes
    const channel = supabase
      .channel('medicines-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, fetchMedicines)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = medicines;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(medicine => 
        medicine.name.toLowerCase().includes(query) || 
        medicine.description?.toLowerCase().includes(query) || 
        medicine.manufacturer?.toLowerCase().includes(query) || 
        medicine.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory) {
      result = result.filter(medicine => medicine.category === filterCategory);
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      if (a[sortColumn] == null) return sortDirection === 'asc' ? -1 : 1;
      if (b[sortColumn] == null) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof a[sortColumn] === 'string' && typeof b[sortColumn] === 'string') {
        return sortDirection === 'asc' 
          ? (a[sortColumn] as string).localeCompare(b[sortColumn] as string)
          : (b[sortColumn] as string).localeCompare(a[sortColumn] as string);
      }
      
      return sortDirection === 'asc' 
        ? (a[sortColumn] as number) - (b[sortColumn] as number)
        : (b[sortColumn] as number) - (a[sortColumn] as number);
    });

    setFilteredMedicines(result);
  }, [medicines, searchQuery, sortColumn, sortDirection, filterCategory]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*');

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

  const handleSort = (column: keyof Medicine) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, expiry_date: format(date, 'yyyy-MM-dd') }));
    } else {
      setFormData(prev => ({ ...prev, expiry_date: '' }));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }

    if (!formData.unit_price || isNaN(Number(formData.unit_price)) || Number(formData.unit_price) <= 0) {
      toast.error('Unit price must be a positive number');
      return false;
    }

    return true;
  };

  const handleAddMedicine = async () => {
    if (!validateForm()) return;

    try {
      // Fix: Ensure name and unit_price are provided and not optional
      const newMedicine = {
        name: formData.name, // Required field
        unit_price: Number(formData.unit_price), // Required field
        category: formData.category || null,
        description: formData.description || null,
        expiry_date: formData.expiry_date || null,
        manufacturer: formData.manufacturer || null,
        stock_quantity: formData.stock_quantity ? Number(formData.stock_quantity) : 0,
        reorder_level: formData.reorder_level ? Number(formData.reorder_level) : 10,
        generic_name: formData.generic_name || null
      };

      const { error } = await supabase
        .from('medicines')
        .insert(newMedicine);

      if (error) throw error;
      
      toast.success('Medicine added successfully');
      setOpenAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add medicine', { 
        description: error.message 
      });
    }
  };

  const handleEditMedicine = async () => {
    if (!validateForm() || !selectedMedicine) return;

    try {
      // Fix: Ensure name and unit_price are provided and not optional
      const updatedMedicine = {
        name: formData.name, // Required field
        unit_price: Number(formData.unit_price), // Required field
        category: formData.category || null,
        description: formData.description || null,
        expiry_date: formData.expiry_date || null,
        manufacturer: formData.manufacturer || null,
        stock_quantity: formData.stock_quantity ? Number(formData.stock_quantity) : 0,
        reorder_level: formData.reorder_level ? Number(formData.reorder_level) : 10,
        generic_name: formData.generic_name || null
      };

      const { error } = await supabase
        .from('medicines')
        .update(updatedMedicine)
        .eq('id', selectedMedicine.id);

      if (error) throw error;
      
      toast.success('Medicine updated successfully');
      setOpenEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to update medicine', { 
        description: error.message 
      });
    }
  };

  const handleDeleteMedicine = async () => {
    if (!selectedMedicine) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', selectedMedicine.id);

      if (error) throw error;
      
      toast.success('Medicine deleted successfully');
      setOpenDeleteDialog(false);
    } catch (error: any) {
      toast.error('Failed to delete medicine', { 
        description: error.message 
      });
    }
  };

  const openEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      unit_price: String(medicine.unit_price),
      category: medicine.category || '',
      description: medicine.description || '',
      expiry_date: medicine.expiry_date || '',
      manufacturer: medicine.manufacturer || '',
      stock_quantity: String(medicine.stock_quantity),
      reorder_level: String(medicine.reorder_level),
      generic_name: medicine.generic_name || ''
    });
    if (medicine.expiry_date) {
      setDate(parseISO(medicine.expiry_date));
    } else {
      setDate(undefined);
    }
    setOpenEditDialog(true);
  };

  const openDelete = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit_price: '',
      category: '',
      description: '',
      expiry_date: '',
      manufacturer: '',
      stock_quantity: '',
      reorder_level: '10',
      generic_name: ''
    });
    setDate(undefined);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '-';
    }
  };

  const renderSortIcon = (column: keyof Medicine) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <Button onClick={() => { resetForm(); setOpenAddDialog(true); }} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> Add Medicine
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>All Medicines</CardTitle>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-8"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetFilters} className="flex-shrink-0">
                <FilterX className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
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
                  <p className="text-sm text-muted-foreground">Try adjusting your search or add a new medicine</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          Name {renderSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                        <div className="flex items-center">
                          Category {renderSortIcon('category')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('stock_quantity')}>
                        <div className="flex items-center">
                          Stock {renderSortIcon('stock_quantity')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('unit_price')}>
                        <div className="flex items-center">
                          Price {renderSortIcon('unit_price')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('expiry_date')}>
                        <div className="flex items-center">
                          Expiry Date {renderSortIcon('expiry_date')}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicines.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell>{medicine.name}</TableCell>
                        <TableCell>{medicine.category || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {medicine.stock_quantity}
                            {medicine.stock_quantity <= medicine.reorder_level && (
                              <Badge variant="destructive" className="ml-2">Low</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${medicine.unit_price.toFixed(2)}</TableCell>
                        <TableCell>{formatDate(medicine.expiry_date)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(medicine)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDelete(medicine)}>
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

      {/* Add Medicine Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name*</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generic_name">Generic Name</Label>
                <Input id="generic_name" name="generic_name" value={formData.generic_name} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price*</Label>
                <Input id="unit_price" name="unit_price" type="number" min="0" step="0.01" value={formData.unit_price} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Initial Stock</Label>
                <Input id="stock_quantity" name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input id="reorder_level" name="reorder_level" type="number" min="0" value={formData.reorder_level} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddMedicine}>Add Medicine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog - Similar structure to Add Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form structure as Add dialog with values from selectedMedicine */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name*</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-generic_name">Generic Name</Label>
                <Input id="edit-generic_name" name="generic_name" value={formData.generic_name} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-unit_price">Unit Price*</Label>
                <Input id="edit-unit_price" name="unit_price" type="number" min="0" step="0.01" value={formData.unit_price} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-stock_quantity">Stock Quantity</Label>
                <Input id="edit-stock_quantity" name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reorder_level">Reorder Level</Label>
                <Input id="edit-reorder_level" name="reorder_level" type="number" min="0" value={formData.reorder_level} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Input id="edit-manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditMedicine}>Save Changes</Button>
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
            <p>Are you sure you want to delete {selectedMedicine?.name}?</p>
            <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteMedicine}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
