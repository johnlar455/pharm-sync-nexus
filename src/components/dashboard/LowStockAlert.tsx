
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

// Types for low stock items
type LowStockItem = {
  id: string;
  name: string;
  sku: string;
  inStock: number;
  threshold: number;
  supplier: string;
  price: number;
};

type LowStockAlertProps = {
  items: LowStockItem[];
  onOrderMore: (itemId: string) => void;
};

export function LowStockAlert({ items, onOrderMore }: LowStockAlertProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Determine stock status
  const getStockStatus = (current: number, threshold: number) => {
    const ratio = current / threshold;
    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'low';
    return 'moderate';
  };
  
  // Get badge color based on stock status
  const getStockBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Low</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Moderate</Badge>;
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Low Stock Alert</h2>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
            <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium">All Stock Levels Healthy</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no items below their threshold levels.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.inStock}</span>
                      <span className="text-xs text-muted-foreground">/ {item.threshold}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStockBadge(getStockStatus(item.inStock, item.threshold))}
                  </TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onOrderMore(item.id)}
                    >
                      Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
