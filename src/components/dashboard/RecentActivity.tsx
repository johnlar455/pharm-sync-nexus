
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type ActivityItem = {
  id: string;
  type: 'sale' | 'inventory' | 'medicine' | 'prescription' | 'user';
  description: string;
  timestamp: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
  className?: string;
};

export function RecentActivity({ activities, className }: RecentActivityProps) {
  // Helper to get activity icon
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'inventory':
        return '📦';
      case 'prescription':
        return '📋';
      case 'medicine':
        return '💊';
      case 'user':
        return '👤';
      default:
        return '📝';
    }
  };

  // Helper to format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
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
                  <p className="text-sm font-medium">{activity.description}</p>
                  <span className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
