
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Filter, ArrowDown, ArrowUp, FileText, Download, Eye, Trash2, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Prescription {
  id: string;
  customer_id: string | null;
  customer: {
    full_name: string;
  } | null;
  created_at: string;
  prescription_date: string;
  doctor_name: string;
  notes: string | null;
  status: string | null;
  items: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  medicine: {
    name: string;
    unit_price: number;
  };
  quantity: number;
  dosage: string | null;
  instructions: string | null;
}

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Medicine {
  id: string;
  name: string;
  unit_price: number;
  stock_quantity: number;
}

// Schema for prescription form
const prescriptionFormSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  doctor_name: z.string().min(1, { message: "Doctor name is required" }),
  prescription_date: z.string().min(1, { message: "Date is required" }),
  notes: z.string().optional(),
  status: z.string().default('active'),
});

// Schema for prescription item form
const prescriptionItemSchema = z.object({
  medicine_id: z.string().min(1, { message: "Medicine is required" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  dosage: z.string().optional(),
  instructions: z.string().optional(),
});

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('prescription_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize forms
  const prescriptionForm = useForm<z.infer<typeof prescriptionFormSchema>>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      customer_id: "",
      doctor_name: "",
      prescription_date: new Date().toISOString().split('T')[0],
      notes: "",
      status: "active",
    },
  });

  const itemForm = useForm<z.infer<typeof prescriptionItemSchema>>({
    resolver: zodResolver(prescriptionItemSchema),
    defaultValues: {
      medicine_id: "",
      quantity: 1,
      dosage: "",
      instructions: "",
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

  // Fetch customers, medicines and prescriptions data
  const fetchData = async () => {
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, email, phone')
        .order('full_name');

      if (customersError) throw customersError;
      if (customersData) setCustomers(customersData as Customer[]);
      
      // Fetch medicines
      const { data: medicinesData, error: medicinesError } = await supabase
        .from('medicines')
        .select('id, name, unit_price, stock_quantity')
        .order('name');

      if (medicinesError) throw medicinesError;
      if (medicinesData) setMedicines(medicinesData as Medicine[]);

    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Failed to load required data",
        variant: "destructive",
      });
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          customer:customer_id (
            full_name
          ),
          items:prescription_items (
            id,
            medicine_id,
            quantity,
            dosage,
            instructions,
            medicine:medicine_id (
              name,
              unit_price
            )
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      
      if (data) {
        setPrescriptions(data as Prescription[]);
      }
    } catch (error) {
      toast({
        title: "Error fetching prescriptions",
        description: "Failed to load prescription data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPrescriptions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('prescription-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prescriptions'
      }, () => fetchPrescriptions())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prescription_items'
      }, () => fetchPrescriptions())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortField, sortDirection]);

  // Filter prescriptions based on search query and status filter
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch = 
      prescription.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Open dialog to create new prescription
  const openNewPrescriptionDialog = () => {
    prescriptionForm.reset({
      customer_id: "",
      doctor_name: "",
      prescription_date: new Date().toISOString().split('T')[0],
      notes: "",
      status: "active",
    });
    setPrescriptionItems([]);
    setCurrentPrescription(null);
    setPrescriptionDialogOpen(true);
  };

  // Open dialog to view prescription
  const openViewPrescriptionDialog = (prescription: Prescription) => {
    setCurrentPrescription(prescription);
    setViewDialogOpen(true);
  };

  // Open dialog to delete prescription
  const openDeleteDialog = (prescription: Prescription) => {
    setCurrentPrescription(prescription);
    setDeleteDialogOpen(true);
  };

  // Open dialog to add medicine to prescription
  const openAddMedicineDialog = () => {
    itemForm.reset({
      medicine_id: "",
      quantity: 1,
      dosage: "",
      instructions: "",
    });
    setItemDialogOpen(true);
  };

  // Handle medicine addition to current prescription
  const handleAddMedicine = (values: z.infer<typeof prescriptionItemSchema>) => {
    const medicine = medicines.find(med => med.id === values.medicine_id);
    
    if (!medicine) {
      toast({
        title: "Error",
        description: "Selected medicine not found",
        variant: "destructive",
      });
      return;
    }
    
    // Check if medicine already exists in prescription
    const existingItemIndex = prescriptionItems.findIndex(
      item => item.medicine_id === values.medicine_id
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...prescriptionItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: values.quantity,
        dosage: values.dosage || null,
        instructions: values.instructions || null,
      };
      setPrescriptionItems(updatedItems);
    } else {
      // Add new item
      setPrescriptionItems([
        ...prescriptionItems,
        {
          id: `temp-${Date.now()}`,
          prescription_id: currentPrescription?.id || 'new',
          medicine_id: values.medicine_id,
          medicine: {
            name: medicine.name,
            unit_price: medicine.unit_price,
          },
          quantity: values.quantity,
          dosage: values.dosage || null,
          instructions: values.instructions || null,
        },
      ]);
    }
    
    setItemDialogOpen(false);
  };

  // Remove medicine from current prescription
  const handleRemoveMedicine = (itemId: string) => {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== itemId));
  };

  // Handle prescription form submission
  const onSubmitPrescription = async (values: z.infer<typeof prescriptionFormSchema>) => {
    try {
      // Validate that there's at least one medicine
      if (prescriptionItems.length === 0) {
        toast({
          title: "No medicines added",
          description: "Please add at least one medicine to the prescription",
          variant: "destructive",
        });
        return;
      }
      
      let prescriptionId = currentPrescription?.id;
      
      if (!prescriptionId) {
        // Create new prescription
        const { data, error } = await supabase
          .from('prescriptions')
          .insert(values)
          .select('id')
          .single();
        
        if (error) throw error;
        prescriptionId = data.id;
      } else {
        // Update existing prescription
        const { error } = await supabase
          .from('prescriptions')
          .update(values)
          .eq('id', prescriptionId);
        
        if (error) throw error;
        
        // Delete existing prescription items
        const { error: deleteError } = await supabase
          .from('prescription_items')
          .delete()
          .eq('prescription_id', prescriptionId);
        
        if (deleteError) throw deleteError;
      }
      
      // Create prescription items
      const prescriptionItemsData = prescriptionItems.map(item => ({
        prescription_id: prescriptionId,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        dosage: item.dosage,
        instructions: item.instructions,
      }));
      
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(prescriptionItemsData);
      
      if (itemsError) throw itemsError;
      
      toast({
        title: currentPrescription ? "Prescription updated" : "Prescription created",
        description: `Prescription has been ${currentPrescription ? 'updated' : 'created'} successfully`,
      });
      
      setPrescriptionDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${currentPrescription ? 'update' : 'create'} prescription`,
        variant: "destructive",
      });
    }
  };

  // Handle prescription deletion
  const handleDeletePrescription = async () => {
    if (!currentPrescription) return;
    
    try {
      // Delete prescription (cascade will delete items)
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', currentPrescription.id);
      
      if (error) throw error;
      
      toast({
        title: "Prescription deleted",
        description: "Prescription and all associated items have been deleted",
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    }
  };

  // Generate prescription status badge
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Calculate total for a prescription
  const calculateTotal = (items: PrescriptionItem[]) => {
    return items.reduce((sum, item) => sum + (item.medicine.unit_price * item.quantity), 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
        <p className="ml-2">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage patient prescriptions</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Report Generated", description: "Prescriptions report has been generated" })}>
            <FileText className="mr-2 h-4 w-4" />
            Report
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Export Started", description: "Prescriptions export has started" })}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={openNewPrescriptionDialog}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search prescriptions..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Prescriptions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('prescription_date')}
                >
                  Date
                  {sortField === 'prescription_date' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('customer.full_name')}
                >
                  Patient
                  {sortField === 'customer.full_name' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('doctor_name')}
                >
                  Doctor
                  {sortField === 'doctor_name' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No prescriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPrescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell>{formatDate(prescription.prescription_date)}</TableCell>
                  <TableCell className="font-medium">{prescription.customer?.full_name || 'Unknown'}</TableCell>
                  <TableCell>{prescription.doctor_name}</TableCell>
                  <TableCell>{prescription.items?.length || 0} items</TableCell>
                  <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{prescription.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewPrescriptionDialog(prescription)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(prescription)}>
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

      {/* Prescription Dialog */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{currentPrescription ? 'Edit Prescription' : 'New Prescription'}</DialogTitle>
            <DialogDescription>
              {currentPrescription ? 'Update prescription details' : 'Create a new prescription for a patient'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...prescriptionForm}>
            <form onSubmit={prescriptionForm.handleSubmit(onSubmitPrescription)} className="space-y-4">
              <FormField
                control={prescriptionForm.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name}
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
                  control={prescriptionForm.control}
                  name="doctor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doctor's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={prescriptionForm.control}
                  name="prescription_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={prescriptionForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={prescriptionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Medicines</h3>
                  <Button type="button" variant="outline" size="sm" onClick={openAddMedicineDialog}>
                    <Plus className="mr-1 h-4 w-4" /> Add Medicine
                  </Button>
                </div>
                
                {prescriptionItems.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-muted-foreground">No medicines added yet</p>
                    <Button type="button" variant="link" onClick={openAddMedicineDialog}>
                      Add medicine
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptionItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.medicine.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.dosage || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.instructions || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMedicine(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{currentPrescription ? 'Update Prescription' : 'Create Prescription'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Medicine Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
            <DialogDescription>
              Add a medicine to this prescription
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleAddMedicine)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="medicine_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {medicines.map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id}>
                            {medicine.name} ({medicine.stock_quantity} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={itemForm.control}
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
                control={itemForm.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 tablet twice daily" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={itemForm.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Take after meals" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Add Medicine</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Prescription Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {currentPrescription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Patient</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{currentPrescription.customer?.full_name || 'Unknown'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{formatDate(currentPrescription.prescription_date)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Doctor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{currentPrescription.doctor_name}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getStatusBadge(currentPrescription.status)}
                  </CardContent>
                </Card>
              </div>
              
              {currentPrescription.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{currentPrescription.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              <div>
                <h3 className="mb-2 text-lg font-medium">Medicines</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Instructions</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPrescription.items?.length ? (
                        currentPrescription.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.medicine?.name}</TableCell>
                            <TableCell>{item.dosage || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.instructions || '-'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.medicine.unit_price * item.quantity)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No medicines in this prescription
                          </TableCell>
                        </TableRow>
                      )}
                      {currentPrescription.items?.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(calculateTotal(currentPrescription.items))}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Edit prescription
                    prescriptionForm.reset({
                      customer_id: currentPrescription.customer_id || '',
                      doctor_name: currentPrescription.doctor_name,
                      prescription_date: currentPrescription.prescription_date,
                      notes: currentPrescription.notes || '',
                      status: currentPrescription.status || 'active',
                    });
                    setPrescriptionItems(currentPrescription.items || []);
                    setViewDialogOpen(false);
                    setPrescriptionDialogOpen(true);
                  }}
                >
                  Edit Prescription
                </Button>
                <Button
                  onClick={() => {
                    // Convert prescription to sale
                    toast({
                      title: "Feature in progress",
                      description: "Converting to sale will be available soon",
                    });
                  }}
                >
                  Convert to Sale
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the prescription and all associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePrescription} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
