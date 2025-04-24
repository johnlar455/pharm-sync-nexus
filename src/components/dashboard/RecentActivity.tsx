
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type ActivityItem = {
  id: string;
  type: 'sale' | 'inventory' | 'prescription' | 'user';
  title: string;
  description: string;
  time: string;
  statusColor?: 'default' | 'success' | 'warning' | 'danger';
  status?: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
  className?: string;
};

export function RecentActivity({ activities, className }: RecentActivityProps) {
  // Helper to get status badge variant
  const getStatusVariant = (statusColor?: ActivityItem['statusColor']) => {
    switch (statusColor) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'danger':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Helper to get activity icon
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'inventory':
        return '📦';
      case 'prescription':
        return '📋';
      case 'user':
        return '👤';
      default:
        return '📝';
    }
  };

  return (
    <div className={`rounded-lg border bg-card p-4 shadow ${className}`}>
      <h2 className="mb-4 font-semibold">Recent Activity</h2>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <span role="img" aria-label={activity.type}>
                  {getActivityIcon(activity.type)}
                </span>
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                
                {activity.status && (
                  <Badge 
                    variant="outline" 
                    className={`mt-1 ${getStatusVariant(activity.statusColor)}`}
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
