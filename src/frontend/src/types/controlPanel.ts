export type ControlType = 'button' | 'toggle' | 'slider' | 'radio';

export interface RadioOption {
  key: string;
  label: string;
  binaryCode: string;
}

export interface ControlConfig {
  id: string;
  label: string;
  controlType: ControlType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  binaryCode: string;
  // Type-specific config
  toggleState?: boolean;
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  radioOptions?: RadioOption[];
  radioSelected?: string;
}

export interface LayoutConfig {
  controls: ControlConfig[];
}
