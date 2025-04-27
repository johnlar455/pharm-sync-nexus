
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  UserPlus,
  Stethoscope,
  Calendar,
  FilterX,
  FileText,
  PlusCircle
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { DialogClose } from '@radix-ui/react-dialog';

interface Medicine {
  id: string;
  name: string;
  unit_price: number;
}

interface Customer {
  id: string;
  full_name: string;
}

interface PrescriptionItem {
  id: string;
  medicine_id: string;
  prescription_id: string;
  quantity: number;
  dosage: string | null;
  instructions: string | null;
  medicine?: {
    name: string;
    unit_price: number;
  };
}

interface Prescription {
  id: string;
  customer_id: string;
  doctor_name: string;
  notes: string | null;
  prescription_date: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  customer?: {
    full_name: string;
  };
  items: PrescriptionItem[];
}

// Prescription status options
const statusOptions = [
  'pending', 
  'completed', 
  'cancelled'
];

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    customer_id: '',
    doctor_name: '',
    prescription_date: '',
    notes: '',
    status: 'pending'
  });
  
  const [prescriptionItems, setPrescriptionItems] = useState<Array<{
    id?: string;
    medicine_id: string;
    quantity: number;
    dosage: string;
    instructions: string;
  }>>([]);
  
  useEffect(() => {
    fetchPrescriptions();
    fetchCustomers();
    fetchMedicines();
    
    // Subscribe to changes
    const channel = supabase
      .channel('prescriptions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, fetchPrescriptions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescription_items' }, fetchPrescriptions)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    let result = [...prescriptions];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(prescription => 
        prescription.customer?.full_name.toLowerCase().includes(query) || 
        prescription.doctor_name.toLowerCase().includes(query) ||
        prescription.items.some(item => 
          item.medicine?.name.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(prescription => prescription.status === statusFilter);
    }
    
    setFilteredPrescriptions(result);
  }, [prescriptions, searchQuery, statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          customer:customer_id (
            full_name
          ),
          items:prescription_items (
            *,
            medicine:medicine_id (
              name,
              unit_price
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Fix the type issue by explicitly typing as Prescription[]
      const typedData: Prescription[] = (data || []).map(prescription => ({
        ...prescription,
        items: prescription.items.map(item => ({
          ...item,
          prescription_id: prescription.id // Ensure prescription_id is included
        }))
      }));
      
      setPrescriptions(typedData);
    } catch (error: any) {
      toast.error('Failed to fetch prescriptions', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name')
        .order('full_name');
        
      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch customers', {
        description: error.message
      });
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, unit_price')
        .order('name');
        
      if (error) throw error;
      
      setMedicines(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch medicines', {
        description: error.message
      });
    }
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
      setFormData(prev => ({ ...prev, prescription_date: format(date, 'yyyy-MM-dd') }));
    } else {
      setFormData(prev => ({ ...prev, prescription_date: '' }));
    }
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems(prev => [
      ...prev,
      {
        medicine_id: '',
        quantity: 1,
        dosage: '',
        instructions: ''
      }
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    setPrescriptionItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return false;
    }

    if (!formData.doctor_name) {
      toast.error('Doctor name is required');
      return false;
    }

    if (!formData.prescription_date) {
      toast.error('Prescription date is required');
      return false;
    }

    if (prescriptionItems.length === 0) {
      toast.error('Please add at least one medicine');
      return false;
    }

    for (let i = 0; i < prescriptionItems.length; i++) {
      if (!prescriptionItems[i].medicine_id) {
        toast.error(`Please select a medicine for item #${i + 1}`);
        return false;
      }
      
      if (!prescriptionItems[i].quantity || prescriptionItems[i].quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for item #${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleAddPrescription = async () => {
    if (!validateForm()) return;

    try {
      // Insert prescription
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          customer_id: formData.customer_id,
          doctor_name: formData.doctor_name, // Required
          prescription_date: formData.prescription_date, // Required
          notes: formData.notes || null,
          status: formData.status
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Insert prescription items
      const items = prescriptionItems.map(item => ({
        prescription_id: prescriptionData.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        dosage: item.dosage || null,
        instructions: item.instructions || null
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast.success('Prescription added successfully');
      setOpenAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add prescription', {
        description: error.message
      });
    }
  };

  const handleEditPrescription = async () => {
    if (!validateForm() || !selectedPrescription) return;

    try {
      // Update prescription
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .update({
          customer_id: formData.customer_id,
          doctor_name: formData.doctor_name, // Required
          prescription_date: formData.prescription_date, // Required
          notes: formData.notes || null,
          status: formData.status
        })
        .eq('id', selectedPrescription.id);

      if (prescriptionError) throw prescriptionError;

      // Delete existing prescription items
      const { error: deleteError } = await supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', selectedPrescription.id);

      if (deleteError) throw deleteError;

      // Insert new prescription items
      const items = prescriptionItems.map(item => ({
        prescription_id: selectedPrescription.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        dosage: item.dosage || null,
        instructions: item.instructions || null
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast.success('Prescription updated successfully');
      setOpenEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to update prescription', {
        description: error.message
      });
    }
  };

  const handleDeletePrescription = async () => {
    if (!selectedPrescription) return;

    try {
      // Delete prescription items first
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', selectedPrescription.id);

      if (itemsError) throw itemsError;

      // Then delete the prescription
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', selectedPrescription.id);

      if (prescriptionError) throw prescriptionError;

      toast.success('Prescription deleted successfully');
      setOpenDeleteDialog(false);
    } catch (error: any) {
      toast.error('Failed to delete prescription', {
        description: error.message
      });
    }
  };

  const openView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setOpenViewDialog(true);
  };

  const openEdit = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setFormData({
      customer_id: prescription.customer_id,
      doctor_name: prescription.doctor_name,
      prescription_date: prescription.prescription_date,
      notes: prescription.notes || '',
      status: prescription.status || 'pending'
    });
    
    // Set date for the date picker
    setDate(parseISO(prescription.prescription_date));
    
    // Set prescription items
    setPrescriptionItems(prescription.items.map(item => ({
      id: item.id,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      dosage: item.dosage || '',
      instructions: item.instructions || ''
    })));
    
    setOpenEditDialog(true);
  };

  const openDelete = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      doctor_name: '',
      prescription_date: '',
      notes: '',
      status: 'pending'
    });
    setPrescriptionItems([]);
    setDate(undefined);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-700">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <Button onClick={() => { resetForm(); addPrescriptionItem(); setOpenAddDialog(true); }} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" /> New Prescription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>All Prescriptions</CardTitle>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-8"
                  placeholder="Search prescriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
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
              <p className="ml-2">Loading prescriptions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredPrescriptions.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-gray-50 p-4 text-center dark:bg-gray-900">
                  <p className="text-lg font-medium">No prescriptions found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Add a new prescription to get started'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>{formatDate(prescription.prescription_date)}</TableCell>
                        <TableCell>{prescription.customer?.full_name || 'Unknown'}</TableCell>
                        <TableCell>{prescription.doctor_name}</TableCell>
                        <TableCell>{prescription.items.length} medicine(s)</TableCell>
                        <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openView(prescription)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(prescription)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => openDelete(prescription)}>
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

      {/* Add Prescription Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-h-[90vh] max-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>Create a new prescription for a patient.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Patient*</Label>
                <Select 
                  name="customer_id" 
                  value={formData.customer_id} 
                  onValueChange={(value) => handleSelectChange('customer_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor_name">Doctor's Name*</Label>
                <Input id="doctor_name" name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prescription Date*</Label>
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  name="status" 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Medicines</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
              </div>
              
              {prescriptionItems.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded border border-dashed">
                  <p className="text-sm text-muted-foreground">No medicines added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Medicine*</Label>
                            <Select 
                              value={item.medicine_id}
                              onValueChange={(value) => updatePrescriptionItem(index, 'medicine_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                              <SelectContent>
                                {medicines.map(medicine => (
                                  <SelectItem key={medicine.id} value={medicine.id}>
                                    {medicine.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity*</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dosage</Label>
                            <Input 
                              placeholder="e.g., 1 tablet twice daily"
                              value={item.dosage}
                              onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Input 
                              placeholder="e.g., Take after meals"
                              value={item.instructions}
                              onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-4 text-red-500 hover:text-red-700"
                          onClick={() => removePrescriptionItem(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddPrescription}>Create Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-h-[90vh] max-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                      <UserPlus className="mr-2 h-4 w-4" /> Patient
                    </h3>
                    <p className="text-lg">{selectedPrescription.customer?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                      <Stethoscope className="mr-2 h-4 w-4" /> Doctor
                    </h3>
                    <p className="text-lg">{selectedPrescription.doctor_name}</p>
                  </div>
                  <div>
                    <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" /> Prescription Date
                    </h3>
                    <p className="text-lg">{formatDate(selectedPrescription.prescription_date)}</p>
                  </div>
                  <div>
                    <h3 className="flex items-center text-sm font-medium text-muted-foreground">
                      <FileText className="mr-2 h-4 w-4" /> Status
                    </h3>
                    <div className="mt-1">
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                  </div>
                </div>
                {selectedPrescription.notes && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-medium">Prescribed Medicines</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Instructions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPrescription.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.medicine?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.dosage || '-'}</TableCell>
                      <TableCell>{item.instructions || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Prescription Dialog - Similar structure to Add Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-h-[90vh] max-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Same form structure as Add prescription dialog */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-customer">Patient*</Label>
                <Select 
                  name="customer_id" 
                  value={formData.customer_id} 
                  onValueChange={(value) => handleSelectChange('customer_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doctor_name">Doctor's Name*</Label>
                <Input id="edit-doctor_name" name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prescription Date*</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  name="status" 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Medicines</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
              </div>
              
              {prescriptionItems.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded border border-dashed">
                  <p className="text-sm text-muted-foreground">No medicines added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Medicine*</Label>
                            <Select 
                              value={item.medicine_id}
                              onValueChange={(value) => updatePrescriptionItem(index, 'medicine_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                              <SelectContent>
                                {medicines.map(medicine => (
                                  <SelectItem key={medicine.id} value={medicine.id}>
                                    {medicine.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity*</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dosage</Label>
                            <Input 
                              placeholder="e.g., 1 tablet twice daily"
                              value={item.dosage}
                              onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Input 
                              placeholder="e.g., Take after meals"
                              value={item.instructions}
                              onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-4 text-red-500 hover:text-red-700"
                          onClick={() => removePrescriptionItem(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditPrescription}>Save Changes</Button>
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
            <p>Are you sure you want to delete this prescription?</p>
            <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeletePrescription}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
