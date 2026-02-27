import type { LayoutConfig, ControlConfig } from '@/types/controlPanel';
import { isValidDecimalCode } from './buttonCode';

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

    // Validate decimal codes based on control type
    if (ctrl.controlType === 'toggle') {
      if (ctrl.decimalCodeOn !== undefined && !isValidDecimalCode(ctrl.decimalCodeOn)) {
        errors.push({ field: `${prefix}.decimalCodeOn`, message: 'Decimal code ON must be between 1 and 16' });
      }
      if (ctrl.decimalCodeOff !== undefined && !isValidDecimalCode(ctrl.decimalCodeOff)) {
        errors.push({ field: `${prefix}.decimalCodeOff`, message: 'Decimal code OFF must be between 1 and 16' });
      }
    } else if (ctrl.controlType === 'slider') {
      if (ctrl.decimalCodeUp !== undefined && !isValidDecimalCode(ctrl.decimalCodeUp)) {
        errors.push({ field: `${prefix}.decimalCodeUp`, message: 'Decimal code UP must be between 1 and 16' });
      }
      if (ctrl.decimalCodeDown !== undefined && !isValidDecimalCode(ctrl.decimalCodeDown)) {
        errors.push({ field: `${prefix}.decimalCodeDown`, message: 'Decimal code DOWN must be between 1 and 16' });
      }
    } else if (ctrl.controlType === 'dial') {
      if (ctrl.decimalCodeLeft !== undefined && !isValidDecimalCode(ctrl.decimalCodeLeft)) {
        errors.push({ field: `${prefix}.decimalCodeLeft`, message: 'Decimal code LEFT must be between 1 and 16' });
      }
      if (ctrl.decimalCodeRight !== undefined && !isValidDecimalCode(ctrl.decimalCodeRight)) {
        errors.push({ field: `${prefix}.decimalCodeRight`, message: 'Decimal code RIGHT must be between 1 and 16' });
      }
    } else {
      if (ctrl.decimalCode !== undefined && !isValidDecimalCode(ctrl.decimalCode)) {
        errors.push({ field: `${prefix}.decimalCode`, message: 'Decimal code must be between 1 and 16' });
      }
    }

    if (typeof ctrl.x !== 'number' || typeof ctrl.y !== 'number') {
      errors.push({ field: `${prefix}.position`, message: 'X and Y must be numbers' });
    }

    if (typeof ctrl.width !== 'number' || typeof ctrl.height !== 'number' || ctrl.width <= 0 || ctrl.height <= 0) {
      errors.push({ field: `${prefix}.size`, message: 'Width and height must be positive numbers' });
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
