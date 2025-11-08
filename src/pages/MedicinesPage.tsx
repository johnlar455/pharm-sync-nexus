import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Medicine = {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  expiry_date: string;
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (current: number, reorder: number) => {
    if (current <= reorder) return 'low';
    if (current <= reorder * 2) return 'medium';
    return 'good';
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'low':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle size={12} />Low Stock</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading medicines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medicines</h1>
          <p className="text-muted-foreground">Manage your pharmacy inventory</p>
        </div>
        <Button onClick={() => toast({ title: "Coming Soon", description: "Medicine form will be available soon" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMedicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine.stock_quantity, medicine.reorder_level);
          
          return (
            <Card key={medicine.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{medicine.name}</CardTitle>
                  {getStockBadge(stockStatus)}
                </div>
                {medicine.description && (
                  <p className="text-sm text-muted-foreground">{medicine.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${medicine.unit_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-medium">{medicine.stock_quantity} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{medicine.category || 'N/A'}</span>
                </div>
                {medicine.manufacturer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span className="font-medium">{medicine.manufacturer}</span>
                  </div>
                )}
                {medicine.expiry_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">
                      {new Date(medicine.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMedicines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No medicines found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first medicine'}
          </p>
              <Button onClick={() => toast({ title: "Coming Soon", description: "Medicine form will be available soon" })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
        </div>
      )}
    </div>
  );
}
