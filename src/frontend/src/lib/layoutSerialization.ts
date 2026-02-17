import type { LayoutConfig, ControlConfig } from '@/types/controlPanel';
import { validateBinaryCode } from './binaryCode';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateLayout(layout: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!layout || typeof layout !== 'object') {
    errors.push({ field: 'root', message: 'Invalid layout format' });
    return errors;
  }

  if (!Array.isArray(layout.controls)) {
    errors.push({ field: 'controls', message: 'Controls must be an array' });
    return errors;
  }

  const ids = new Set<string>();

  layout.controls.forEach((ctrl: any, idx: number) => {
    const prefix = `controls[${idx}]`;

    if (!ctrl.id || typeof ctrl.id !== 'string') {
      errors.push({ field: `${prefix}.id`, message: 'ID is required and must be a string' });
    } else if (ids.has(ctrl.id)) {
      errors.push({ field: `${prefix}.id`, message: `Duplicate ID: ${ctrl.id}` });
    } else {
      ids.add(ctrl.id);
    }

    if (!ctrl.controlType || !['button', 'toggle', 'slider', 'radio', 'dial'].includes(ctrl.controlType)) {
      errors.push({ field: `${prefix}.controlType`, message: 'Invalid control type' });
    }

    const binaryError = validateBinaryCode(ctrl.binaryCode || '');
    if (binaryError) {
      errors.push({ field: `${prefix}.binaryCode`, message: binaryError });
    }

    if (typeof ctrl.x !== 'number' || typeof ctrl.y !== 'number') {
      errors.push({ field: `${prefix}.position`, message: 'X and Y must be numbers' });
    }

    if (typeof ctrl.width !== 'number' || typeof ctrl.height !== 'number' || ctrl.width <= 0 || ctrl.height <= 0) {
      errors.push({ field: `${prefix}.size`, message: 'Width and height must be positive numbers' });
    }

    if (ctrl.controlType === 'slider') {
      if (ctrl.sliderIsVertical !== undefined && typeof ctrl.sliderIsVertical !== 'boolean') {
        errors.push({ field: `${prefix}.sliderIsVertical`, message: 'sliderIsVertical must be a boolean' });
      }
    }

    if (ctrl.controlType === 'radio') {
      if (ctrl.radioGroupIsVertical !== undefined && typeof ctrl.radioGroupIsVertical !== 'boolean') {
        errors.push({ field: `${prefix}.radioGroupIsVertical`, message: 'radioGroupIsVertical must be a boolean' });
      }
      
      if (Array.isArray(ctrl.radioOptions)) {
        ctrl.radioOptions.forEach((opt: any, optIdx: number) => {
          const optError = validateBinaryCode(opt.binaryCode || '');
          if (optError) {
            errors.push({
              field: `${prefix}.radioOptions[${optIdx}].binaryCode`,
              message: optError,
            });
          }
        });
      }
    }

    if (ctrl.controlType === 'dial') {
      const increaseError = validateBinaryCode(ctrl.dialIncreaseBinaryCode || '');
      if (increaseError) {
        errors.push({ field: `${prefix}.dialIncreaseBinaryCode`, message: increaseError });
      }
      
      const decreaseError = validateBinaryCode(ctrl.dialDecreaseBinaryCode || '');
      if (decreaseError) {
        errors.push({ field: `${prefix}.dialDecreaseBinaryCode`, message: decreaseError });
      }
    }
  });

  return errors;
}

export function exportLayout(layout: LayoutConfig): string {
  return JSON.stringify(layout, null, 2);
}

export function importLayout(json: string): { layout?: LayoutConfig; errors?: ValidationError[] } {
  try {
    const parsed = JSON.parse(json);
    const errors = validateLayout(parsed);

    if (errors.length > 0) {
      return { errors };
    }

    return { layout: parsed as LayoutConfig };
  } catch (error) {
    return {
      errors: [{ field: 'root', message: 'Invalid JSON format' }],
    };
  }
}
