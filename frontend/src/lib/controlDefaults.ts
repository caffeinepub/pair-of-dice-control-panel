import type { ControlConfig, ControlType } from '@/types/controlPanel';
import { generateDecimalCodeFromSeed } from './buttonCode';

export function getControlDefaults(type: ControlType): Omit<ControlConfig, 'id' | 'decimalCode'> {
  const baseDefaults = {
    label: 'New Control',
    x: 50,
    y: 50,
    width: 120,
    height: 80,
    color: '#dc2626',
  };

  switch (type) {
    case 'button':
      return {
        ...baseDefaults,
        controlType: 'button',
      };
    case 'toggle':
      return {
        ...baseDefaults,
        controlType: 'toggle',
        toggleState: false,
      };
    case 'slider':
      return {
        ...baseDefaults,
        controlType: 'slider',
        sliderValue: 50,
        sliderMin: 0,
        sliderMax: 100,
        sliderIsVertical: false,
        width: 200,
        height: 60,
      };
    case 'radio':
      return {
        ...baseDefaults,
        controlType: 'radio',
        radioOptions: [
          { key: 'option_1', label: 'Option 1', decimalCode: 1 },
          { key: 'option_2', label: 'Option 2', decimalCode: 2 },
        ],
        radioSelected: 'option_1',
        radioGroupIsVertical: true,
        height: 120,
      };
    case 'dial':
      return {
        ...baseDefaults,
        controlType: 'dial',
        width: 120,
        height: 120,
      };
    default:
      return {
        ...baseDefaults,
        controlType: 'button',
      };
  }
}

/**
 * Generate dual decimal codes for controls that need them (toggle, slider, dial).
 * Returns an object with the appropriate decimal code fields based on control type.
 */
export function generateDualCodesForControl(
  seed: string,
  type: ControlType
): Partial<Pick<ControlConfig, 'decimalCode' | 'decimalCodeOn' | 'decimalCodeOff' | 'decimalCodeUp' | 'decimalCodeDown' | 'decimalCodeLeft' | 'decimalCodeRight'>> {
  const code1 = generateDecimalCodeFromSeed(seed);
  const code2 = generateDecimalCodeFromSeed(seed + '_alt');

  switch (type) {
    case 'toggle':
      return {
        decimalCodeOn: code1,
        decimalCodeOff: code2,
      };
    case 'slider':
      return {
        decimalCodeUp: code1,
        decimalCodeDown: code2,
      };
    case 'dial':
      return {
        decimalCodeLeft: code1,
        decimalCodeRight: code2,
      };
    case 'button':
    case 'radio':
    default:
      return {
        decimalCode: code1,
      };
  }
}
