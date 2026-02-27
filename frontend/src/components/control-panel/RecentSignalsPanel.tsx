import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentSignals } from '@/hooks/useRecentSignals';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RecentSignalsPanel() {
  const { events, isLoading, error, refetch } = useRecentSignals();

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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch events. Check backend connection.
            </AlertDescription>
          </Alert>
        )}
        <ScrollArea className="h-[300px]">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signals emitted yet</p>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div
                  key={`${event.controlId}-${event.timestamp}-${index}`}
                  className="rounded-lg border bg-card p-3 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {event.controlName || 'Unnamed Control'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Type: {event.controlType} • Value: {event.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Code: {Number(event.decimalCode)} • {event.codeType}
                      </div>
                      {event.commandStr && (
                        <div className="text-xs font-mono text-muted-foreground mt-1 bg-muted/50 p-1 rounded">
                          {event.commandStr}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatTimestamp(event.timestamp)}
                    </div>
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
