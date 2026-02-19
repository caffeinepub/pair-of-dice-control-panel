import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
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
      decimalCode,
      codeType,
      commandStr,
    }: {
      controlId: string;
      controlType: string;
      controlName?: string;
      value: string;
      decimalCode: number;
      codeType: string;
      commandStr: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const codeTypeLabel = codeType ? ` [${codeType}]` : '';
      console.log(
        `[Signal Emitter] Control: ${controlName || 'Unnamed'} (id: ${controlId}) - Type: ${controlType}, Value: ${value}, Code: ${decimalCode}${codeTypeLabel}, Command: ${commandStr}`
      );
      
      // Button controls use emitButtonEvent
      if (controlType === 'button') {
        console.log(`[Signal Emitter] Calling emitButtonEvent with:`, {
          controlId,
          controlType,
          controlName: controlName || null,
          value,
          codeType,
          decimalCode: BigInt(decimalCode),
          commandStr
        });
        await actor.emitButtonEvent(
          controlId,
          controlType,
          controlName || null,
          value,
          codeType,
          BigInt(decimalCode),
          commandStr
        );
      } else {
        // Other control types also use emitButtonEvent (it's a generic event emitter)
        console.log(`[Signal Emitter] Calling emitButtonEvent for ${controlType} with:`, {
          controlId,
          controlType,
          controlName: controlName || null,
          value,
          codeType,
          decimalCode: BigInt(decimalCode),
          commandStr
        });
        await actor.emitButtonEvent(
          controlId,
          controlType,
          controlName || null,
          value,
          codeType,
          BigInt(decimalCode),
          commandStr
        );
      }
    },
    onSuccess: () => {
      console.log('[Signal Emitter] Event emitted successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['recentEvents'] });
    },
    onError: (error) => {
      console.error('[Signal Emitter] Failed to emit signal:', error);
      toast.error(`Failed to emit signal: ${error.message}`);
    },
  });

  const emit = (
    controlId: string, 
    controlType: string, 
    controlName: string | null, 
    value: string,
    decimalCode: number,
    codeType: string,
    commandStr: string
  ) => {
    console.log('[Signal Emitter] emit() called with:', {
      controlId,
      controlType,
      controlName,
      value,
      decimalCode,
      codeType,
      commandStr
    });
    
    emitMutation.mutate({ 
      controlId, 
      controlType, 
      controlName: controlName || undefined, 
      value,
      decimalCode,
      codeType,
      commandStr
    });
  };

  return { emit, isEmitting: emitMutation.isPending };
}
