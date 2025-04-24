
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Types for expiring items
type ExpiringItem = {
  id: string;
  name: string;
  batch: string;
  expiryDate: string;
  daysLeft: number;
  quantity: number;
};

type ExpiringSoonProps = {
  items: ExpiringItem[];
};

export function ExpiringSoon({ items }: ExpiringSoonProps) {
  // Get expiry status
  const getExpiryStatus = (daysLeft: number) => {
    if (daysLeft <= 7) return 'critical';
    if (daysLeft <= 30) return 'warning';
    return 'moderate';
  };
  
  // Get badge for expiry status
  const getExpiryBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Expires in {status === 'critical' ? 'a week' : 'soon'}</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Expires soon</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Expiring</Badge>;
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Expiring Soon</h2>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium">No Items Expiring Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All inventory items are within safe expiration dates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const status = getExpiryStatus(item.daysLeft);
            
            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {getExpiryBadge(status)}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Batch: {item.batch}</span>
                    <span>•</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">{formatDate(item.expiryDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.daysLeft} days left
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
