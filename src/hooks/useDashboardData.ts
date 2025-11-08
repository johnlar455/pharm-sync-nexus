
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  expiringCount: number;
  todaySales: number;
  recentActivity: Array<{
    id: string;
    type: 'sale' | 'inventory' | 'medicine' | 'prescription';
    description: string;
    timestamp: string;
  }>;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todaySales: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      const weekFromNow = oneWeekFromNow.toISOString().split('T')[0];
      
      console.log('Fetching dashboard data...');

      // Get total medicines count
      const { count: medicinesCount, error: medicinesError } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true });

      if (medicinesError) {
        console.error('Error fetching medicines count:', medicinesError);
      }

      // Get all medicines to check stock levels and expiry
      const { data: allMedicines, error: allMedicinesError } = await supabase
        .from('medicines')
        .select('id, name, stock_quantity, reorder_level, expiry_date');

      if (allMedicinesError) {
        console.error('Error fetching medicines:', allMedicinesError);
      }

      // Calculate low stock items
      const lowStockItems = allMedicines?.filter(med => 
        med.stock_quantity <= med.reorder_level
      ) || [];

      // Calculate expiring items
      const expiringItems = allMedicines?.filter(med => 
        med.expiry_date && new Date(med.expiry_date) <= oneWeekFromNow
      ) || [];

      // Get today's sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      }

      // Get recent activity from multiple sources
      const [recentSales, recentInventory, recentPrescriptions] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            customers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(3),
        
        supabase
          .from('inventory_transactions')
          .select(`
            id,
            transaction_type,
            quantity,
            created_at,
            medicines(name)
          `)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('prescriptions')
          .select(`
            id,
            doctor_name,
            created_at,
            customers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(2)
      ]);

      // Combine activities
      const activities = [];

      // Add sales activities
      if (recentSales.data) {
        activities.push(...recentSales.data.map(sale => ({
          id: sale.id,
          type: 'sale' as const,
          description: `Sale to ${sale.customers?.name || 'Customer'} - $${sale.total_amount}`,
          timestamp: sale.created_at,
        })));
      }

      // Add inventory activities
      if (recentInventory.data) {
        activities.push(...recentInventory.data.map(transaction => ({
          id: transaction.id,
          type: 'inventory' as const,
          description: `${transaction.transaction_type === 'in' ? 'Added' : 'Removed'} ${transaction.quantity} ${transaction.medicines?.name || 'items'}`,
          timestamp: transaction.created_at,
        })));
      }

      // Add prescription activities
      if (recentPrescriptions.data) {
        activities.push(...recentPrescriptions.data.map(prescription => ({
          id: prescription.id,
          type: 'prescription' as const,
          description: `New prescription by Dr. ${prescription.doctor_name} for ${prescription.customers?.name || 'Patient'}`,
          timestamp: prescription.created_at,
        })));
      }

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setStats({
        totalMedicines: medicinesCount || 0,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
        todaySales: sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
        recentActivity: activities.slice(0, 8),
      });

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Error fetching dashboard data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'medicines' 
      }, () => {
        console.log('Medicines table changed, refreshing dashboard...');
        fetchDashboardData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'sales' 
      }, () => {
        console.log('Sales table changed, refreshing dashboard...');
        fetchDashboardData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'inventory_transactions' 
      }, () => {
        console.log('Inventory transactions changed, refreshing dashboard...');
        fetchDashboardData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'prescriptions' 
      }, () => {
        console.log('Prescriptions changed, refreshing dashboard...');
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, isLoading, refetch: fetchDashboardData };
};
