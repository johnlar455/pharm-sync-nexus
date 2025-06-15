
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';

type Medicine = {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  expiry_date: string;
  created_at: string;
  updated_at: string;
};

export default function MedicinesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medicines = [], isLoading, error } = useQuery({
    queryKey: ['medicines', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Medicine[];
    },
  });

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock_quantity <= 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const };
    } else if (medicine.stock_quantity <= medicine.reorder_level) {
      return { status: 'Low Stock', variant: 'default' as const };
    }
    return { status: 'In Stock', variant: 'secondary' as const };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return expiry <= oneMonthFromNow;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading medicines. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        <Button className="bg-pharmacy-600 hover:bg-pharmacy-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine);
          const expiringSoon = medicine.expiry_date && isExpiringSoon(medicine.expiry_date);
          
          return (
            <Card key={medicine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {medicine.name}
                  </CardTitle>
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.status}
                  </Badge>
                </div>
                {medicine.generic_name && (
                  <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${medicine.unit_price}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-medium ${medicine.stock_quantity <= medicine.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                    {medicine.stock_quantity} units
                  </span>
                </div>
                
                {medicine.manufacturer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="font-medium">{medicine.manufacturer}</span>
                  </div>
                )}
                
                {medicine.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{medicine.category}</span>
                  </div>
                )}
                
                {medicine.expiry_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expiry:</span>
                    <span className={`font-medium ${expiringSoon ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(medicine.expiry_date).toLocaleDateString()}
                      {expiringSoon && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {medicines.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new medicine.'}
          </p>
        </div>
      )}
    </div>
  );
}
