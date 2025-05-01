
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, BarChart as BarChartIcon, FileText, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as RechartsBarChart } from 'recharts';

const mockSalesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 2000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
];

const mockInventoryData = [
  { name: 'Antibiotics', count: 24 },
  { name: 'Analgesics', count: 13 },
  { name: 'Supplements', count: 42 },
  { name: 'Cardiovascular', count: 17 },
  { name: 'Respiratory', count: 22 },
];

const mockExpenseData = [
  { name: 'Stock', amount: 5000 },
  { name: 'Rent', amount: 2000 },
  { name: 'Salaries', amount: 7000 },
  { name: 'Utilities', amount: 1000 },
  { name: 'Marketing', amount: 1500 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [currentTab, setCurrentTab] = useState('sales');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Custom Date Range
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5" />
                Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockSalesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#4f46e5" name="Sales ($)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5" />
                Inventory Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockInventoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Item Count" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5" />
                Expenses Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockExpenseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#f43f5e" name="Expenses ($)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
