import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import { sendGpioSignal } from '@/lib/gpioHttp';

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
      if (!actor) {
        throw new Error('Actor not initialized');
      }

      // Call backend actor to log the event
      await actor.emitButtonEvent(
        controlId,
        controlType,
        controlName || null,
        value,
        codeType,
        BigInt(decimalCode),
        commandStr
      );

      // Send HTTP POST to GPIO server for button controls
      if (controlType === 'button') {
        const httpState = value === 'press' ? 'on' : 'off';
        try {
          await sendGpioSignal(decimalCode, httpState);
        } catch (httpError) {
          const reason = httpError instanceof Error ? httpError.message : 'Unknown error';
          // Surface the HTTP error as a toast but don't fail the mutation —
          // the backend event was already logged successfully.
          toast.warning(`GPIO HTTP signal failed: ${reason}`, {
            description: 'The event was logged to the backend, but the local GPIO server did not receive the signal.',
            duration: 6000,
          });
          console.warn('[useSignalEmitter] HTTP POST failed (backend event was logged):', reason);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentEvents'] });
    },
    onError: (error) => {
      toast.error(`Failed to emit signal: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    emitMutation.mutate({
      controlId,
      controlType,
      controlName: controlName || undefined,
      value,
      decimalCode,
      codeType,
      commandStr,
    });
  };

  return { emit, isEmitting: emitMutation.isPending };
}
