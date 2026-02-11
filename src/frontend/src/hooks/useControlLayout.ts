import { createContext, useContext } from 'react';
import type { ControlConfig, LayoutConfig } from '@/types/controlPanel';

export interface ControlLayoutContextValue {
  controls: ControlConfig[];
  selectedControlId: string | null;
  selectedControl: ControlConfig | undefined;
  setSelectedControlId: (id: string | null) => void;
  createControl: () => void;
  createControlWithConfig: (config: {
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
    sliderIsVertical?: boolean;
    radioOptions?: Array<{ key: string; label: string; binaryCode: string }>;
    radioGroupIsVertical?: boolean;
  }) => boolean;
  updateControl: (id: string, updates: Partial<ControlConfig>) => void;
  deleteControl: (id: string) => void;
  validateId: (id: string, currentId?: string) => string | null;
  saveLayout: () => void;
  applyImportedLayout: (layout: LayoutConfig) => void;
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
}

export const ControlLayoutContext = createContext<ControlLayoutContextValue | null>(null);

export function useControlLayout() {
  const context = useContext(ControlLayoutContext);
  if (!context) {
    throw new Error('useControlLayout must be used within ControlLayoutProvider');
  }
  return context;
}
