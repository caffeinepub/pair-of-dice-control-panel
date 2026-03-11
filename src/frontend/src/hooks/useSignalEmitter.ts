import { sendGpioSignal } from "@/lib/gpioHttp";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

/**
 * Maps a control interaction to the correct GPIO HTTP state ("on" or "off").
 * - button:  "press" -> "on", anything else -> "off"
 * - toggle:  codeType "on" -> "on", "off" -> "off"
 * - slider:  both "up" and "down" represent movement, send "on"
 * - radio:   selection -> "on"
 * - dial:    both directions are active steps, send "on"
 */
function resolveHttpState(
  controlType: string,
  value: string,
  codeType: string,
): "on" | "off" {
  switch (controlType) {
    case "button":
      return value === "press" ? "on" : "off";
    case "toggle":
      return codeType === "on" ? "on" : "off";
    default:
      // slider (up/down), radio (selection), dial (left/right) all send "on"
      return "on";
  }
}

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
        throw new Error("Actor not initialized");
      }

      // Log the event to the backend
      await actor.emitButtonEvent(
        controlId,
        controlType,
        controlName || null,
        value,
        codeType,
        BigInt(decimalCode),
        commandStr,
      );

      // Send HTTP POST to GPIO server for ALL control types.
      // Content-Type is forced to application/json via Blob body.
      // mode: no-cors fires the request without requiring CORS headers from the server.
      const httpState = resolveHttpState(controlType, value, codeType);
      try {
        await sendGpioSignal(decimalCode, httpState);
      } catch (httpError) {
        const reason =
          httpError instanceof Error ? httpError.message : "Unknown error";
        toast.warning(`GPIO HTTP signal failed: ${reason}`, {
          description:
            "The event was logged to the backend, but the GPIO server at 7426razpi3.nevadascientific.com did not receive the signal.",
          duration: 6000,
        });
        console.warn(
          "[useSignalEmitter] HTTP POST failed (backend event was logged):",
          reason,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentEvents"] });
    },
    onError: (error) => {
      toast.error(
        `Failed to emit signal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    },
  });

  const emit = (
    controlId: string,
    controlType: string,
    controlName: string | null,
    value: string,
    decimalCode: number,
    codeType: string,
    commandStr: string,
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
