import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentSignals } from '@/hooks/useRecentSignals';
import { RefreshCw } from 'lucide-react';

export function RecentSignalsPanel() {
  const { events, isLoading, refetch } = useRecentSignals();

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Signals</CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signals emitted yet</p>
          ) : (
            <div className="space-y-2">
              {events.map((event, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-destructive">{event.binaryCode}</span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">{event.controlId}</span> • {event.controlType} • {event.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
