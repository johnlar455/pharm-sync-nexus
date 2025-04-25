
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Filter, ArrowDown, ArrowUp, FileText, Download, Edit, Trash2 } from 'lucide-react';
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Medicine {
  id: string;
  name: string;
  stock_quantity: number;
  unit_price: number;
  expiry_date: string | null;
  category: string | null;
  manufacturer: string | null;
  description: string | null;
  created_at: string;
}

// Validation schema for the medicine form
const medicineFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  stock_quantity: z.number().min(0, { message: "Quantity cannot be negative" }),
  unit_price: z.number().min(0, { message: "Price cannot be negative" }),
  expiry_date: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize the form
  const form = useForm<z.infer<typeof medicineFormSchema>>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      name: "",
      stock_quantity: 0,
      unit_price: 0,
      expiry_date: "",
      category: "",
      manufacturer: "",
      description: "",
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
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      if (data) {
        setMedicines(data as Medicine[]);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map(med => med.category).filter(Boolean))
        ) as string[];
        
        setCategories(uniqueCategories);
      }
    } catch (error) {
      toast({
        title: "Error fetching medicines",
        description: "Failed to load medicines data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();

    // Set up real-time subscription
    const channel = supabase
      .channel('medicines-changes')
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

  // Filter medicines based on search query and category
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Open the add/edit dialog
  const openDialog = (medicine?: Medicine) => {
    if (medicine) {
      setCurrentMedicine(medicine);
      form.reset({
        name: medicine.name,
        stock_quantity: medicine.stock_quantity,
        unit_price: medicine.unit_price,
        expiry_date: medicine.expiry_date || undefined,
        category: medicine.category || undefined,
        manufacturer: medicine.manufacturer || undefined,
        description: medicine.description || undefined,
      });
    } else {
      setCurrentMedicine(null);
      form.reset({
        name: "",
        stock_quantity: 0,
        unit_price: 0,
        expiry_date: "",
        category: "",
        manufacturer: "",
        description: "",
      });
    }
    setDialogOpen(true);
  };

  // Handle medicine form submission
  const onSubmit = async (values: z.infer<typeof medicineFormSchema>) => {
    try {
      if (currentMedicine) {
        // Update existing medicine
        const { error } = await supabase
          .from('medicines')
          .update(values)
          .eq('id', currentMedicine.id);

        if (error) throw error;

        toast({
          title: "Medicine updated",
          description: `${values.name} has been updated successfully`,
        });
      } else {
        // Add new medicine - FIX: Don't wrap values in an array
        const { error } = await supabase
          .from('medicines')
          .insert(values); // This was the issue, values was being wrapped in an array

        if (error) throw error;

        toast({
          title: "Medicine added",
          description: `${values.name} has been added to inventory`,
        });
      }

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save medicine data",
        variant: "destructive",
      });
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (medicine: Medicine) => {
    setCurrentMedicine(medicine);
    setDeleteDialogOpen(true);
  };

  // Handle medicine deletion
  const handleDelete = async () => {
    if (!currentMedicine) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', currentMedicine.id);

      if (error) throw error;

      toast({
        title: "Medicine deleted",
        description: `${currentMedicine.name} has been removed from inventory`,
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get stock status badge
  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity < 10) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
        <p className="ml-2">Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Medicines</h1>
          <p className="text-muted-foreground">Manage your pharmacy products</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Report Generated", description: "Medicine inventory report has been generated" })}>
            <FileText className="mr-2 h-4 w-4" />
            Report
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Export Started", description: "Medicine inventory export has started" })}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search medicines..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Medicines Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <button
                  className="flex items-center"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('category')}
                >
                  Category
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('stock_quantity')}
                >
                  Quantity
                  {sortField === 'stock_quantity' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('unit_price')}
                >
                  Price
                  {sortField === 'unit_price' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('expiry_date')}
                >
                  Expiry Date
                  {sortField === 'expiry_date' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No medicines found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.category || 'Uncategorized'}</TableCell>
                  <TableCell>{medicine.stock_quantity}</TableCell>
                  <TableCell>{formatPrice(medicine.unit_price)}</TableCell>
                  <TableCell>{getStockBadge(medicine.stock_quantity)}</TableCell>
                  <TableCell>{formatDate(medicine.expiry_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(medicine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(medicine)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Medicine Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentMedicine ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
            <DialogDescription>
              {currentMedicine ? 'Update medicine details' : 'Add a new medicine to inventory'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Medicine name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))} 
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
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Category" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="Manufacturer" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{currentMedicine ? 'Save Changes' : 'Add Medicine'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {currentMedicine?.name} 
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
