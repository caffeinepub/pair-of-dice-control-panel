export type ControlType = 'button' | 'toggle' | 'slider' | 'radio' | 'dial';

export interface RadioOption {
  key: string;
  label: string;
  decimalCode: number;
}

/**
 * Control configuration with decimal codes (1-16).
 * All decimal code fields must be in range 1-16.
 */
export interface ControlConfig {
  id: string;
  label: string;
  controlType: ControlType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  
  // Decimal codes (1-16) - used internally, converted to/from backend
  decimalCode?: number;
  decimalCodeOn?: number;
  decimalCodeOff?: number;
  decimalCodeLeft?: number;
  decimalCodeRight?: number;
  decimalCodeUp?: number;
  decimalCodeDown?: number;
  
  // Type-specific config
  toggleState?: boolean;
  
  // Slider config
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderIsVertical?: boolean;
  
  // Radio config
  radioOptions?: RadioOption[];
  radioSelected?: string;
  radioGroupIsVertical?: boolean;
}

export interface LayoutConfig {
  controls: ControlConfig[];
}
