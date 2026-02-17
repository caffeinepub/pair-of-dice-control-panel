import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { binaryToDecimal } from '@/lib/buttonCode';
import { toast } from 'sonner';

export function useSignalEmitter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const emitMutation = useMutation({
    mutationFn: async ({
      controlId,
      controlType,
      controlName,
      value,
      binaryCode,
    }: {
      controlId: string;
      controlType: string;
      controlName: string | null;
      value: string;
      binaryCode: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Log the interaction with both name and id
      console.log(
        `Control interaction: ${controlName || 'Unnamed'} (id: ${controlId}) - ${controlType} ${value} [${binaryCode}]`
      );
      
      // Convert binary code to decimal for backend
      const decimalCode = BigInt(binaryToDecimal(binaryCode));
      
      await actor.emitEvent(controlId, controlType, controlName, value, decimalCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentEvents'] });
    },
    onError: (error) => {
      toast.error(`Failed to emit signal: ${error.message}`);
    },
  });

  const emit = (
    controlId: string, 
    controlType: string, 
    controlName: string | null, 
    value: string, 
    binaryCode: string
  ) => {
    emitMutation.mutate({ controlId, controlType, controlName, value, binaryCode });
  };

  return { emit, isEmitting: emitMutation.isPending };
}
