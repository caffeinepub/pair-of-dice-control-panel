import type { ControlConfig, ControlType } from '@/types/controlPanel';

export function getControlDefaults(type: ControlType): Omit<ControlConfig, 'id' | 'binaryCode'> {
  const baseDefaults = {
    label: 'New Control',
    x: 50,
    y: 50,
    width: 120,
    height: 80,
    color: '#dc2626', // red-600
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
        width: 200,
        height: 60,
      };
    case 'radio':
      return {
        ...baseDefaults,
        controlType: 'radio',
        radioOptions: [
          { key: 'option_1', label: 'Option 1', binaryCode: '0001' },
          { key: 'option_2', label: 'Option 2', binaryCode: '0010' },
        ],
        radioSelected: 'option_1',
        radioGroupIsVertical: true,
        height: 120,
      };
    default:
      return {
        ...baseDefaults,
        controlType: 'button',
      };
  }
}
