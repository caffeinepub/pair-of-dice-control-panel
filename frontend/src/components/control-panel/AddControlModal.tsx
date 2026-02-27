import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useControlLayout } from '@/hooks/useControlLayout';
import { validateDecimalCode, generateDecimalCodeFromSeed } from '@/lib/buttonCode';
import { getControlDefaults, generateDualCodesForControl } from '@/lib/controlDefaults';
import type { ControlType, RadioOption } from '@/types/controlPanel';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AddControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddControlModal({ open, onOpenChange }: AddControlModalProps) {
  const { createControlWithConfig, validateId } = useControlLayout();

  const [controlType, setControlType] = useState<ControlType>('button');
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [decimalCode, setDecimalCode] = useState('1');
  
  // Toggle dual codes
  const [decimalCodeOn, setDecimalCodeOn] = useState('');
  const [decimalCodeOff, setDecimalCodeOff] = useState('');
  
  // Slider config and dual codes
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [sliderIsVertical, setSliderIsVertical] = useState(false);
  const [decimalCodeUp, setDecimalCodeUp] = useState('');
  const [decimalCodeDown, setDecimalCodeDown] = useState('');
  
  // Radio config
  const [radioOptions, setRadioOptions] = useState<RadioOption[]>([
    { key: 'option_1', label: 'Option 1', decimalCode: 1 },
    { key: 'option_2', label: 'Option 2', decimalCode: 2 },
  ]);
  const [radioGroupIsVertical, setRadioGroupIsVertical] = useState(true);
  
  // Dial dual codes
  const [decimalCodeLeft, setDecimalCodeLeft] = useState('');
  const [decimalCodeRight, setDecimalCodeRight] = useState('');

  const resetForm = () => {
    const newId = `control_${Date.now()}`;
    setId(newId);
    setLabel('New Control');
    setDecimalCode('1');
    setControlType('button');
    
    // Reset toggle codes
    setDecimalCodeOn('');
    setDecimalCodeOff('');
    
    // Reset slider
    setSliderMin(0);
    setSliderMax(100);
    setSliderIsVertical(false);
    setDecimalCodeUp('');
    setDecimalCodeDown('');
    
    // Reset radio
    setRadioOptions([
      { key: 'option_1', label: 'Option 1', decimalCode: 1 },
      { key: 'option_2', label: 'Option 2', decimalCode: 2 },
    ]);
    setRadioGroupIsVertical(true);
    
    // Reset dial
    setDecimalCodeLeft('');
    setDecimalCodeRight('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleControlTypeChange = (newType: ControlType) => {
    setControlType(newType);
    
    // Generate dual codes for the new control type
    const dualCodes = generateDualCodesForControl(id, newType);
    
    if (newType === 'toggle') {
      setDecimalCodeOn((dualCodes.decimalCodeOn || 1).toString());
      setDecimalCodeOff((dualCodes.decimalCodeOff || 2).toString());
    } else if (newType === 'slider') {
      setDecimalCodeUp((dualCodes.decimalCodeUp || 1).toString());
      setDecimalCodeDown((dualCodes.decimalCodeDown || 2).toString());
    } else if (newType === 'dial') {
      setDecimalCodeLeft((dualCodes.decimalCodeLeft || 1).toString());
      setDecimalCodeRight((dualCodes.decimalCodeRight || 2).toString());
    } else if (newType === 'radio') {
      // Reset radio options with sequential decimal codes
      setRadioOptions([
        { key: 'option_1', label: 'Option 1', decimalCode: 1 },
        { key: 'option_2', label: 'Option 2', decimalCode: 2 },
      ]);
    } else {
      setDecimalCode((dualCodes.decimalCode || 1).toString());
    }
  };

  const handleCreate = () => {
    const idError = validateId(id);
    if (idError) {
      toast.error(idError);
      return;
    }

    // Validate decimal codes based on control type
    if (controlType === 'button') {
      const error = validateDecimalCode(decimalCode);
      if (error) {
        toast.error(error);
        return;
      }
    }

    if (controlType === 'radio') {
      // Validate all radio option decimal codes
      for (const option of radioOptions) {
        const error = validateDecimalCode(option.decimalCode.toString());
        if (error) {
          toast.error(`Radio option "${option.label}": ${error}`);
          return;
        }
      }
    }

    if (controlType === 'toggle') {
      const onError = validateDecimalCode(decimalCodeOn);
      if (onError) {
        toast.error(`Toggle ON code: ${onError}`);
        return;
      }
      const offError = validateDecimalCode(decimalCodeOff);
      if (offError) {
        toast.error(`Toggle OFF code: ${offError}`);
        return;
      }
    }

    if (controlType === 'slider') {
      const upError = validateDecimalCode(decimalCodeUp);
      if (upError) {
        toast.error(`Slider UP code: ${upError}`);
        return;
      }
      const downError = validateDecimalCode(decimalCodeDown);
      if (downError) {
        toast.error(`Slider DOWN code: ${downError}`);
        return;
      }
    }

    if (controlType === 'dial') {
      const leftError = validateDecimalCode(decimalCodeLeft);
      if (leftError) {
        toast.error(`Dial LEFT code: ${leftError}`);
        return;
      }
      const rightError = validateDecimalCode(decimalCodeRight);
      if (rightError) {
        toast.error(`Dial RIGHT code: ${rightError}`);
        return;
      }
    }

    const defaults = getControlDefaults(controlType);
    const config: any = {
      id,
      label,
      controlType,
      x: defaults.x,
      y: defaults.y,
      width: defaults.width,
      height: defaults.height,
      color: defaults.color,
    };

    if (controlType === 'button') {
      config.decimalCode = parseInt(decimalCode, 10);
    }

    if (controlType === 'toggle') {
      config.decimalCodeOn = parseInt(decimalCodeOn, 10);
      config.decimalCodeOff = parseInt(decimalCodeOff, 10);
    }

    if (controlType === 'slider') {
      config.sliderMin = sliderMin;
      config.sliderMax = sliderMax;
      config.sliderIsVertical = sliderIsVertical;
      config.decimalCodeUp = parseInt(decimalCodeUp, 10);
      config.decimalCodeDown = parseInt(decimalCodeDown, 10);
    }

    if (controlType === 'radio') {
      config.radioOptions = radioOptions;
      config.radioGroupIsVertical = radioGroupIsVertical;
    }

    if (controlType === 'dial') {
      config.decimalCodeLeft = parseInt(decimalCodeLeft, 10);
      config.decimalCodeRight = parseInt(decimalCodeRight, 10);
    }

    const success = createControlWithConfig(config);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const nextCode = radioOptions.length > 0 
      ? Math.min(16, Math.max(...radioOptions.map(o => o.decimalCode)) + 1)
      : 1;
    setRadioOptions([
      ...radioOptions,
      {
        key: newKey,
        label: 'New Option',
        decimalCode: nextCode,
      },
    ]);
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    setRadioOptions(radioOptions.map((opt) => (opt.key === key ? { ...opt, ...updates } : opt)));
  };

  const handleDeleteRadioOption = (key: string) => {
    setRadioOptions(radioOptions.filter((opt) => opt.key !== key));
  };

  const sanitizeDecimalInput = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  const decimalCodeError = controlType === 'button' ? validateDecimalCode(decimalCode) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Control</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-id">ID</Label>
            <Input id="new-id" value={id} onChange={(e) => setId(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-label">Label</Label>
            <Input id="new-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-type">Control Type</Label>
            <Select value={controlType} onValueChange={(value) => handleControlTypeChange(value as ControlType)}>
              <SelectTrigger id="new-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="button">Button</SelectItem>
                <SelectItem value="toggle">Toggle</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="radio">Radio Group</SelectItem>
                <SelectItem value="dial">Dial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {controlType === 'button' && (
            <div className="space-y-2">
              <Label htmlFor="new-decimalCode">Decimal Code (1–16)</Label>
              <Input
                id="new-decimalCode"
                type="number"
                min="1"
                max="16"
                value={decimalCode}
                onChange={(e) => setDecimalCode(sanitizeDecimalInput(e.target.value))}
                placeholder="e.g., 1"
              />
              {decimalCodeError && (
                <p className="text-sm text-destructive">{decimalCodeError}</p>
              )}
            </div>
          )}

          {controlType === 'toggle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-toggleOn">ON Code (1–16)</Label>
                <Input
                  id="new-toggleOn"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeOn}
                  onChange={(e) => setDecimalCodeOn(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-toggleOff">OFF Code (1–16)</Label>
                <Input
                  id="new-toggleOff"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeOff}
                  onChange={(e) => setDecimalCodeOff(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 2"
                />
              </div>
            </>
          )}

          {controlType === 'slider' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-sliderOrientation">Orientation</Label>
                <Select
                  value={sliderIsVertical ? 'vertical' : 'horizontal'}
                  onValueChange={(value) => setSliderIsVertical(value === 'vertical')}
                >
                  <SelectTrigger id="new-sliderOrientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-sliderMin">Min</Label>
                  <Input
                    id="new-sliderMin"
                    type="number"
                    value={sliderMin}
                    onChange={(e) => setSliderMin(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-sliderMax">Max</Label>
                  <Input
                    id="new-sliderMax"
                    type="number"
                    value={sliderMax}
                    onChange={(e) => setSliderMax(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sliderUp">UP Code (1–16)</Label>
                <Input
                  id="new-sliderUp"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeUp}
                  onChange={(e) => setDecimalCodeUp(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sliderDown">DOWN Code (1–16)</Label>
                <Input
                  id="new-sliderDown"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeDown}
                  onChange={(e) => setDecimalCodeDown(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 2"
                />
              </div>
            </>
          )}

          {controlType === 'radio' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-radioOrientation">Orientation</Label>
                <Select
                  value={radioGroupIsVertical ? 'vertical' : 'horizontal'}
                  onValueChange={(value) => setRadioGroupIsVertical(value === 'vertical')}
                >
                  <SelectTrigger id="new-radioOrientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Radio Options</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddRadioOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {radioOptions.map((option) => (
                    <Card key={option.key} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => handleUpdateRadioOption(option.key, { label: e.target.value })}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRadioOption(option.key)}
                          disabled={radioOptions.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Decimal Code (1–16)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="16"
                          placeholder="Decimal Code (1-16)"
                          value={option.decimalCode}
                          onChange={(e) =>
                            handleUpdateRadioOption(option.key, { decimalCode: parseInt(e.target.value, 10) || 1 })
                          }
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {controlType === 'dial' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-dialLeft">LEFT (Counterclockwise) Code (1–16)</Label>
                <Input
                  id="new-dialLeft"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeLeft}
                  onChange={(e) => setDecimalCodeLeft(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-dialRight">RIGHT (Clockwise) Code (1–16)</Label>
                <Input
                  id="new-dialRight"
                  type="number"
                  min="1"
                  max="16"
                  value={decimalCodeRight}
                  onChange={(e) => setDecimalCodeRight(sanitizeDecimalInput(e.target.value))}
                  placeholder="e.g., 2"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={controlType === 'button' && !!decimalCodeError}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
