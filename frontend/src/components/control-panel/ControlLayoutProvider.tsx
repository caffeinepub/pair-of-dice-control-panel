import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import { ControlLayoutContext, type ControlLayoutContextValue } from '@/hooks/useControlLayout';
import type { ControlConfig, LayoutConfig } from '@/types/controlPanel';
import type { Layout, Control } from '@/backend';
import { getControlDefaults, generateDualCodesForControl } from '@/lib/controlDefaults';
import { generateDecimalCodeFromSeed } from '@/lib/buttonCode';
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
  useEffect(() => {
    if (actor && !isActorFetching) {
      if (layoutQuery.isFetched || layoutQuery.isError) {
        setIsInitialized(true);
      }
    }
  }, [actor, isActorFetching, layoutQuery.isFetched, layoutQuery.isError]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: LayoutConfig) => {
      if (!actor) throw new Error('Actor not initialized');
      
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
    const dualCodes = generateDualCodesForControl(newId, 'button');
    const newControl: ControlConfig = {
      ...defaults,
      id: newId,
      ...dualCodes,
    } as ControlConfig;

    setLocalControls((prev) => [...prev, newControl]);
    setSelectedControlId(newControl.id);
    toast.success(`Control "${newControl.label}" created`);
  }, []);

  const createControlWithConfig = useCallback(
    (config: Partial<ControlConfig> & { id: string; controlType: string }) => {
      const defaults = getControlDefaults(config.controlType as any);
      const newControl: ControlConfig = {
        ...defaults,
        ...config,
      } as ControlConfig;

      setLocalControls((prev) => [...prev, newControl]);
      setSelectedControlId(newControl.id);
      toast.success(`Control "${newControl.label}" created`);
      return true;
    },
    []
  );

  const updateControl = useCallback((id: string, updates: Partial<ControlConfig>) => {
    setLocalControls((prev) =>
      prev.map((control) => (control.id === id ? { ...control, ...updates } : control))
    );
  }, []);

  const deleteControl = useCallback((id: string) => {
    setLocalControls((prev) => prev.filter((control) => control.id !== id));
    setSelectedControlId(null);
    toast.success('Control deleted');
  }, []);

  const applyImportedLayout = useCallback((layout: LayoutConfig) => {
    setLocalControls(layout.controls);
    setSelectedControlId(null);
    toast.success('Layout imported successfully');
  }, []);

  const validateId = useCallback(
    (id: string, currentId?: string) => {
      if (!id) return 'ID is required';
      if (id !== currentId && localControls.some((c) => c.id === id)) {
        return 'ID already exists';
      }
      return null;
    },
    [localControls]
  );

  const selectedControl = localControls.find((c) => c.id === selectedControlId) || undefined;

  const contextValue: ControlLayoutContextValue = {
    controls: localControls,
    selectedControlId,
    selectedControl,
    setSelectedControlId,
    isLoading: layoutQuery.isLoading,
    isSaving: saveLayoutMutation.isPending,
    isInitialized,
    createControl,
    createControlWithConfig,
    updateControl,
    deleteControl,
    saveLayout,
    applyImportedLayout,
    validateId,
  };

  return <ControlLayoutContext.Provider value={contextValue}>{children}</ControlLayoutContext.Provider>;
}

// Serialize frontend layout to backend format
function serializeLayout(layout: LayoutConfig): Layout {
  return {
    controls: layout.controls.map((control) => {
      const backendControl: Control = {
        id: control.id,
        controlName: control.label || undefined,
        controlType: control.controlType,
        decimalCode: BigInt(control.decimalCode || 1),
        decimalCodeOn: control.decimalCodeOn !== undefined ? BigInt(control.decimalCodeOn) : undefined,
        decimalCodeOff: control.decimalCodeOff !== undefined ? BigInt(control.decimalCodeOff) : undefined,
        decimalCodeUp: control.decimalCodeUp !== undefined ? BigInt(control.decimalCodeUp) : undefined,
        decimalCodeDown: control.decimalCodeDown !== undefined ? BigInt(control.decimalCodeDown) : undefined,
        decimalCodeLeft: control.decimalCodeLeft !== undefined ? BigInt(control.decimalCodeLeft) : undefined,
        decimalCodeRight: control.decimalCodeRight !== undefined ? BigInt(control.decimalCodeRight) : undefined,
        radioOptions: control.radioOptions?.map((opt) => opt.label),
        radioGroupIsVertical: control.radioGroupIsVertical,
        sliderIsVertical: control.sliderIsVertical,
      };
      return backendControl;
    }),
  };
}

// Deserialize backend layout to frontend format
function deserializeLayout(backendLayout: Layout): LayoutConfig {
  return {
    controls: backendLayout.controls.map((control) => {
      const frontendControl: ControlConfig = {
        id: control.id,
        label: control.controlName || 'Unnamed',
        controlType: control.controlType as any,
        x: 50,
        y: 50,
        width: 120,
        height: 80,
        color: '#dc2626',
        decimalCode: control.decimalCode !== undefined ? Number(control.decimalCode) : undefined,
        decimalCodeOn: control.decimalCodeOn !== undefined ? Number(control.decimalCodeOn) : undefined,
        decimalCodeOff: control.decimalCodeOff !== undefined ? Number(control.decimalCodeOff) : undefined,
        decimalCodeUp: control.decimalCodeUp !== undefined ? Number(control.decimalCodeUp) : undefined,
        decimalCodeDown: control.decimalCodeDown !== undefined ? Number(control.decimalCodeDown) : undefined,
        decimalCodeLeft: control.decimalCodeLeft !== undefined ? Number(control.decimalCodeLeft) : undefined,
        decimalCodeRight: control.decimalCodeRight !== undefined ? Number(control.decimalCodeRight) : undefined,
        sliderIsVertical: control.sliderIsVertical,
        radioGroupIsVertical: control.radioGroupIsVertical,
      };

      // Handle radio options - assign decimal codes 1-16 based on index
      if (control.controlType === 'radio' && control.radioOptions) {
        frontendControl.radioOptions = control.radioOptions.map((label, index) => ({
          key: `option_${index + 1}`,
          label,
          decimalCode: index + 1, // Decimal codes 1-16 based on position
        }));
        frontendControl.radioSelected = frontendControl.radioOptions[0]?.key;
      }

      return frontendControl;
    }),
  };
}
