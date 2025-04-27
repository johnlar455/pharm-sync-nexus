
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
    type: 'sale' | 'inventory' | 'medicine';
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
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { data: medicines },
        { data: lowStock },
        { data: expiring },
        { data: sales },
        { data: activity }
      ] = await Promise.all([
        supabase.from('medicines').select('count').single(),
        supabase.from('medicines')
          .select('id')
          .lt('stock_quantity', supabase.rpc('get_reorder_level')), // Fix for the original error
        supabase.from('medicines')
          .select('id')
          .lt('expiry_date', `${today}`),
        supabase.from('sales')
          .select('total_amount')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase.from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            customer:customers(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setStats({
        totalMedicines: medicines?.count || 0,
        lowStockCount: lowStock?.length || 0,
        expiringCount: expiring?.length || 0,
        todaySales: sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
        recentActivity: activity?.map(sale => ({
          id: sale.id,
          type: 'sale',
          description: `Sale to ${sale.customer?.full_name || 'Customer'} - $${sale.total_amount}`,
          timestamp: sale.created_at,
        })) || [],
      });
    } catch (error) {
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
      }, () => fetchDashboardData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'sales' 
      }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, isLoading };
};
