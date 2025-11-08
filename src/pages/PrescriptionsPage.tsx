
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Prescription = {
  id: string;
  customer_id: string;
  doctor_name: string;
  issue_date: string;
  status: string;
  notes: string;
  created_at: string;
  customers: {
    name: string;
  } | null;
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          customers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const activePrescriptions = prescriptions.filter(p => p.status?.toLowerCase() === 'active').length;
  const todayPrescriptions = prescriptions.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.created_at).toDateString() === today;
  }).length;

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage patient prescriptions</p>
        </div>
        <Button onClick={() => toast({ title: "Coming Soon", description: "Prescription form will be available soon" })}>
          <Plus className="mr-2 h-4 w-4" />
          New Prescription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrescriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayPrescriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prescriptions.length > 0 
                ? Math.round((prescriptions.filter(p => p.status?.toLowerCase() === 'completed').length / prescriptions.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No prescriptions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first prescription'}
              </p>
              <Button onClick={() => toast({ title: "Coming Soon", description: "Prescription form will be available soon" })}>
                <Plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">
                      {prescription.customers?.name || 'Unknown Patient'}
                    </TableCell>
                    <TableCell>{prescription.doctor_name}</TableCell>
                    <TableCell>
                      {new Date(prescription.issue_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(prescription.status)}
                    </TableCell>
                    <TableCell>{prescription.notes || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
