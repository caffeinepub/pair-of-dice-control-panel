import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ControlConfig, LayoutConfig } from '@/types/controlPanel';
import type { Layout, Control } from '@/backend';
import { getControlDefaults } from '@/lib/controlDefaults';
import { generateDefaultBinaryCode } from '@/lib/binaryCode';
import { toast } from 'sonner';

export function useControlLayout() {
  const { actor, isFetching: isActorFetching } = useActor();
  const queryClient = useQueryClient();
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [localControls, setLocalControls] = useState<ControlConfig[]>([]);

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

  // Sync local controls with query data
  useEffect(() => {
    if (layoutQuery.data) {
      setLocalControls(layoutQuery.data.controls);
    }
  }, [layoutQuery.data]);

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
    controlType: 'button' | 'toggle' | 'slider' | 'radio';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    binaryCode: string;
    sliderMin?: number;
    sliderMax?: number;
    radioOptions?: Array<{ key: string; label: string; binaryCode: string }>;
  }) => {
    const defaults = getControlDefaults(config.controlType);
    const newControl: ControlConfig = {
      ...defaults,
      ...config,
    };
    
    setLocalControls((prev) => [...prev, newControl]);
    setSelectedControlId(config.id);
    toast.success('Control created');
  }, []);

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
    setLocalControls(layout.controls);
    setSelectedControlId(null);
    saveLayoutMutation.mutate(layout);
  }, [saveLayoutMutation]);

  const selectedControl = localControls.find((ctrl) => ctrl.id === selectedControlId);

  return {
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
    isLoading: layoutQuery.isLoading,
    isSaving: saveLayoutMutation.isPending,
  };
}

function deserializeLayout(backendLayout: Layout): LayoutConfig {
  const controls: ControlConfig[] = backendLayout.controls.map((ctrl) => {
    const defaults = getControlDefaults(ctrl.controlType as any);
    
    // Parse radio options if present
    let radioOptions = defaults.radioOptions;
    if (ctrl.radioOptions && ctrl.radioOptions.length > 0) {
      radioOptions = ctrl.radioOptions.map((opt, idx) => ({
        key: `option_${idx}`,
        label: opt,
        binaryCode: generateDefaultBinaryCode(`${ctrl.id}_${opt}`),
      }));
    }

    return {
      ...defaults,
      id: ctrl.id,
      controlType: ctrl.controlType as any,
      binaryCode: ctrl.binaryCode,
      radioOptions,
    };
  });

  return { controls };
}

function serializeLayout(layout: LayoutConfig): Layout {
  const controls: Control[] = layout.controls.map((ctrl) => ({
    id: ctrl.id,
    controlType: ctrl.controlType,
    binaryCode: ctrl.binaryCode,
    radioOptions: ctrl.radioOptions?.map((opt) => opt.label),
  }));

  return { controls };
}
