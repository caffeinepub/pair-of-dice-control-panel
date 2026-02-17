import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import { ControlLayoutContext, type ControlLayoutContextValue } from '@/hooks/useControlLayout';
import type { ControlConfig, LayoutConfig } from '@/types/controlPanel';
import type { Layout, Control } from '@/backend';
import { getControlDefaults } from '@/lib/controlDefaults';
import { generateDefaultBinaryCode, validateBinaryCode } from '@/lib/binaryCode';
import { binaryToDecimal, decimalToBinary } from '@/lib/buttonCode';
import { toast } from 'sonner';

export function ControlLayoutProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching: isActorFetching } = useActor();
  const queryClient = useQueryClient();
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [localControls, setLocalControls] = useState<ControlConfig[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load layout from backend
  const layoutQuery = useQuery<LayoutConfig>({
    queryKey: ['layout'],
    queryFn: async () => {
      if (!actor) return { controls: [] };
      const backendLayout = await actor.getLayout();
      return deserializeLayout(backendLayout);
    },
    enabled: !!actor && !isActorFetching,
  });

  // Sync local controls with query data and mark as initialized
  useEffect(() => {
    if (layoutQuery.data) {
      setLocalControls(layoutQuery.data.controls);
      setIsInitialized(true);
    }
  }, [layoutQuery.data]);

  // Also mark as initialized if query completes with error or if actor becomes available
  // This ensures we don't stay stuck in uninitialized state
  useEffect(() => {
    if (actor && !isActorFetching) {
      // If query has run (success or error), mark as initialized
      if (layoutQuery.isFetched || layoutQuery.isError) {
        setIsInitialized(true);
      }
    }
  }, [actor, isActorFetching, layoutQuery.isFetched, layoutQuery.isError]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: LayoutConfig) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Validate all binary codes before saving
      for (const control of layout.controls) {
        const error = validateBinaryCode(control.binaryCode);
        if (error) {
          throw new Error(`Control "${control.label}" (${control.id}): ${error}`);
        }
        
        // Validate radio option binary codes
        if (control.controlType === 'radio' && control.radioOptions) {
          for (const option of control.radioOptions) {
            const optionError = validateBinaryCode(option.binaryCode);
            if (optionError) {
              throw new Error(`Control "${control.label}" radio option "${option.label}": ${optionError}`);
            }
          }
        }
        
        // Validate dial binary codes
        if (control.controlType === 'dial') {
          const increaseError = validateBinaryCode(control.dialIncreaseBinaryCode || '');
          if (increaseError) {
            throw new Error(`Control "${control.label}" dial increase code: ${increaseError}`);
          }
          const decreaseError = validateBinaryCode(control.dialDecreaseBinaryCode || '');
          if (decreaseError) {
            throw new Error(`Control "${control.label}" dial decrease code: ${decreaseError}`);
          }
        }
      }
      
      const backendLayout = serializeLayout(layout);
      await actor.saveLayout(backendLayout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout'] });
      toast.success('Layout saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save layout: ${error.message}`);
    },
  });

  const saveLayout = useCallback(() => {
    saveLayoutMutation.mutate({ controls: localControls });
  }, [localControls, saveLayoutMutation]);

  const createControl = useCallback(() => {
    const newId = `control_${Date.now()}`;
    const defaults = getControlDefaults('button');
    const newControl: ControlConfig = {
      ...defaults,
      id: newId,
      binaryCode: generateDefaultBinaryCode(newId),
    };
    setLocalControls((prev) => [...prev, newControl]);
    setSelectedControlId(newId);
  }, []);

  const createControlWithConfig = useCallback((config: {
    id: string;
    label: string;
    controlType: 'button' | 'toggle' | 'slider' | 'radio' | 'dial';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    binaryCode: string;
    sliderMin?: number;
    sliderMax?: number;
    sliderIsVertical?: boolean;
    radioOptions?: Array<{ key: string; label: string; binaryCode: string }>;
    radioGroupIsVertical?: boolean;
    dialIncreaseBinaryCode?: string;
    dialDecreaseBinaryCode?: string;
  }): boolean => {
    if (!isInitialized) {
      toast.error('Control layout not initialized. Please wait and try again.');
      return false;
    }

    const defaults = getControlDefaults(config.controlType);
    const newControl: ControlConfig = {
      ...defaults,
      ...config,
    };
    
    setLocalControls((prev) => [...prev, newControl]);
    setSelectedControlId(config.id);
    toast.success('Control created');
    return true;
  }, [isInitialized]);

  const updateControl = useCallback((id: string, updates: Partial<ControlConfig>) => {
    setLocalControls((prev) =>
      prev.map((ctrl) => (ctrl.id === id ? { ...ctrl, ...updates } : ctrl))
    );
  }, []);

  const deleteControl = useCallback((id: string) => {
    setLocalControls((prev) => prev.filter((ctrl) => ctrl.id !== id));
    if (selectedControlId === id) {
      setSelectedControlId(null);
    }
  }, [selectedControlId]);

  const validateId = useCallback(
    (id: string, currentId?: string): string | null => {
      if (!id.trim()) return 'ID cannot be empty';
      if (localControls.some((ctrl) => ctrl.id === id && ctrl.id !== currentId)) {
        return 'ID must be unique';
      }
      return null;
    },
    [localControls]
  );

  const applyImportedLayout = useCallback((layout: LayoutConfig) => {
    // Validate all binary codes before applying
    for (const control of layout.controls) {
      const error = validateBinaryCode(control.binaryCode);
      if (error) {
        toast.error(`Cannot import: Control "${control.label}" (${control.id}): ${error}`);
        return;
      }
      
      // Validate radio option binary codes
      if (control.controlType === 'radio' && control.radioOptions) {
        for (const option of control.radioOptions) {
          const optionError = validateBinaryCode(option.binaryCode);
          if (optionError) {
            toast.error(`Cannot import: Control "${control.label}" radio option "${option.label}": ${optionError}`);
            return;
          }
        }
      }
      
      // Validate dial binary codes
      if (control.controlType === 'dial') {
        const increaseError = validateBinaryCode(control.dialIncreaseBinaryCode || '');
        if (increaseError) {
          toast.error(`Cannot import: Control "${control.label}" dial increase code: ${increaseError}`);
          return;
        }
        const decreaseError = validateBinaryCode(control.dialDecreaseBinaryCode || '');
        if (decreaseError) {
          toast.error(`Cannot import: Control "${control.label}" dial decrease code: ${decreaseError}`);
          return;
        }
      }
    }
    
    setLocalControls(layout.controls);
    setSelectedControlId(null);
    saveLayoutMutation.mutate(layout);
  }, [saveLayoutMutation]);

  const selectedControl = localControls.find((ctrl) => ctrl.id === selectedControlId);

  const value: ControlLayoutContextValue = {
    controls: localControls,
    selectedControlId,
    selectedControl,
    setSelectedControlId,
    createControl,
    createControlWithConfig,
    updateControl,
    deleteControl,
    validateId,
    saveLayout,
    applyImportedLayout,
    isLoading: layoutQuery.isLoading || isActorFetching,
    isSaving: saveLayoutMutation.isPending,
    isInitialized,
  };

  return <ControlLayoutContext.Provider value={value}>{children}</ControlLayoutContext.Provider>;
}

function deserializeLayout(backendLayout: Layout): LayoutConfig {
  const controls: ControlConfig[] = backendLayout.controls.map((ctrl) => {
    const defaults = getControlDefaults(ctrl.controlType as any);
    
    // Convert decimal code to binary for frontend use
    const binaryCode = decimalToBinary(Number(ctrl.decimalCode));
    
    // Parse radio options if present
    let radioOptions = defaults.radioOptions;
    if (ctrl.radioOptions && ctrl.radioOptions.length > 0) {
      radioOptions = ctrl.radioOptions.map((opt, idx) => ({
        key: `option_${idx}`,
        label: opt,
        binaryCode: generateDefaultBinaryCode(`${ctrl.id}_${opt}`),
      }));
    }

    // Parse radio group orientation (default to true/vertical if not present for backward compatibility)
    const radioGroupIsVertical = ctrl.radioGroupIsVertical !== undefined ? ctrl.radioGroupIsVertical : true;

    // Parse slider orientation (default to false/horizontal if not present for backward compatibility)
    const sliderIsVertical = ctrl.sliderIsVertical !== undefined ? ctrl.sliderIsVertical : false;

    // Convert dial decimal codes to binary for frontend use
    const dialIncreaseBinaryCode = ctrl.dialIncreaseCode !== undefined 
      ? decimalToBinary(Number(ctrl.dialIncreaseCode))
      : undefined;
    const dialDecreaseBinaryCode = ctrl.dialDecreaseCode !== undefined 
      ? decimalToBinary(Number(ctrl.dialDecreaseCode))
      : undefined;

    return {
      ...defaults,
      id: ctrl.id,
      controlType: ctrl.controlType as any,
      label: ctrl.controlName || defaults.label,
      binaryCode,
      radioOptions,
      radioGroupIsVertical,
      sliderIsVertical,
      dialIncreaseBinaryCode,
      dialDecreaseBinaryCode,
    };
  });

  return { controls };
}

function serializeLayout(layout: LayoutConfig): Layout {
  const controls: Control[] = layout.controls.map((ctrl) => ({
    id: ctrl.id,
    controlType: ctrl.controlType,
    controlName: ctrl.label,
    decimalCode: BigInt(binaryToDecimal(ctrl.binaryCode)),
    radioOptions: ctrl.radioOptions?.map((opt) => opt.label),
    radioGroupIsVertical: ctrl.radioGroupIsVertical,
    sliderIsVertical: ctrl.sliderIsVertical,
    dialIncreaseCode: ctrl.dialIncreaseBinaryCode 
      ? BigInt(binaryToDecimal(ctrl.dialIncreaseBinaryCode))
      : undefined,
    dialDecreaseCode: ctrl.dialDecreaseBinaryCode 
      ? BigInt(binaryToDecimal(ctrl.dialDecreaseBinaryCode))
      : undefined,
  }));

  return { controls };
}
