
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar, User, Plus } from 'lucide-react';

type Prescription = {
  id: string;
  prescription_date: string;
  doctor_name: string;
  notes: string;
  status: string;
  created_at: string;
  customers: {
    full_name: string;
    phone: string;
  } | null;
  prescription_items: {
    id: string;
    quantity: number;
    dosage: string;
    instructions: string;
    medicines: {
      name: string;
      generic_name: string;
    } | null;
  }[];
};

export default function PrescriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          customers(full_name, phone),
          prescription_items(
            id,
            quantity,
            dosage,
            instructions,
            medicines(name, generic_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`doctor_name.ilike.%${searchTerm}%,customers.full_name.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Prescription[];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <Button className="bg-pharmacy-600 hover:bg-pharmacy-700">
          <Plus className="w-4 h-4 mr-2" />
          New Prescription
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-6">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Prescription #{prescription.id.slice(0, 8)}
                  </CardTitle>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {prescription.customers?.full_name || 'Unknown Patient'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(prescription.prescription_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {getStatusBadge(prescription.status || 'pending')}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Doctor Information</h4>
                  <p className="text-sm text-gray-600">{prescription.doctor_name}</p>
                </div>
                
                {prescription.customers?.phone && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Patient Contact</h4>
                    <p className="text-sm text-gray-600">{prescription.customers.phone}</p>
                  </div>
                )}
              </div>

              {prescription.prescription_items && prescription.prescription_items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prescribed Medicines</h4>
                  <div className="space-y-2">
                    {prescription.prescription_items.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.medicines?.name || 'Unknown Medicine'}</p>
                            {item.medicines?.generic_name && (
                              <p className="text-sm text-gray-600">{item.medicines.generic_name}</p>
                            )}
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            {item.dosage && (
                              <p className="text-sm text-gray-600">Dosage: {item.dosage}</p>
                            )}
                          </div>
                        </div>
                        {item.instructions && (
                          <p className="text-sm text-gray-700 mt-2">
                            Instructions: {item.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prescription.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {prescriptions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Start by creating a new prescription.'}
          </p>
        </div>
      )}
    </div>
  );
}
