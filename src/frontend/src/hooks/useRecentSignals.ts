import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Event } from '@/backend';

export function useRecentSignals() {
  const { actor, isFetching: isActorFetching } = useActor();

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['recentEvents'],
    queryFn: async () => {
      if (!actor) {
        console.log('[Recent Signals] Actor not available');
        return [];
      }
      console.log('[Recent Signals] Fetching events from backend...');
      const events = await actor.getRecentEvents();
      console.log('[Recent Signals] Fetched events:', events.length);
      return events;
    },
    enabled: !!actor && !isActorFetching,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0, // Always consider data stale to ensure fresh fetches after invalidation
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
  };
}
