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
  sliderIsVertical?: boolean;
  radioOptions?: RadioOption[];
  radioSelected?: string;
  radioGroupIsVertical?: boolean;
}

export interface LayoutConfig {
  controls: ControlConfig[];
}
