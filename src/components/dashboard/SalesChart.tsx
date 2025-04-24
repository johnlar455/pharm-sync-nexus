
import { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// Types for the chart data
type ChartData = {
  name: string;
  sales: number;
  revenue: number;
};

// Types for the component props
type SalesChartProps = {
  data: {
    daily: ChartData[];
    weekly: ChartData[];
    monthly: ChartData[];
  };
};

export function SalesChart({ data }: SalesChartProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Display data based on selected time range
  const chartData = data[timeRange];
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Showing sales data for selected period</CardDescription>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant={timeRange === 'daily' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setTimeRange('daily')}
          >
            Day
          </Button>
          <Button 
            variant={timeRange === 'weekly' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setTimeRange('weekly')}
          >
            Week
          </Button>
          <Button 
            variant={timeRange === 'monthly' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => setTimeRange('monthly')}
          >
            Month
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value)]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0EA5E9"
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Sales"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
