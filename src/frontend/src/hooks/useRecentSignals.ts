import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Event } from '@/backend';

export function useRecentSignals() {
  const { actor, isFetching: isActorFetching } = useActor();

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['recentEvents'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentEvents();
    },
    enabled: !!actor && !isActorFetching,
    refetchInterval: 2000, // Poll every 2 seconds (increased from 5 seconds)
    staleTime: 0, // Always consider data stale to ensure fresh fetches after invalidation
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    refetch: eventsQuery.refetch,
  };
}
