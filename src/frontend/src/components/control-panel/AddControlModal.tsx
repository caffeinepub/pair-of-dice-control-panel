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
import { validateBinaryCode, generateDefaultBinaryCode } from '@/lib/binaryCode';
import { decimalToBinary, validateDecimalCode, binaryToDecimal } from '@/lib/buttonCode';
import { getControlDefaults } from '@/lib/controlDefaults';
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
  const [binaryCode, setBinaryCode] = useState('');
  const [buttonDecimalCode, setButtonDecimalCode] = useState('1');
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [sliderIsVertical, setSliderIsVertical] = useState(false);
  const [radioOptions, setRadioOptions] = useState<RadioOption[]>([
    { key: 'option_1', label: 'Option 1', binaryCode: '0001' },
    { key: 'option_2', label: 'Option 2', binaryCode: '0010' },
  ]);
  const [radioGroupIsVertical, setRadioGroupIsVertical] = useState(true);
  const [dialIncreaseBinaryCode, setDialIncreaseBinaryCode] = useState('0001');
  const [dialDecreaseBinaryCode, setDialDecreaseBinaryCode] = useState('0010');

  const resetForm = () => {
    const newId = `control_${Date.now()}`;
    setId(newId);
    setLabel('New Control');
    setBinaryCode(generateDefaultBinaryCode(newId));
    setButtonDecimalCode('1');
    setControlType('button');
    setSliderMin(0);
    setSliderMax(100);
    setSliderIsVertical(false);
    setRadioOptions([
      { key: 'option_1', label: 'Option 1', binaryCode: '0001' },
      { key: 'option_2', label: 'Option 2', binaryCode: '0010' },
    ]);
    setRadioGroupIsVertical(true);
    setDialIncreaseBinaryCode('0001');
    setDialDecreaseBinaryCode('0010');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleCreate = () => {
    const idError = validateId(id);
    if (idError) {
      toast.error(idError);
      return;
    }

    // For button controls, validate decimal code and convert to binary
    let finalBinaryCode = binaryCode;
    if (controlType === 'button') {
      const decimalError = validateDecimalCode(buttonDecimalCode);
      if (decimalError) {
        toast.error(decimalError);
        return;
      }
      try {
        finalBinaryCode = decimalToBinary(parseInt(buttonDecimalCode, 10));
      } catch (error) {
        toast.error('Invalid button code');
        return;
      }
    } else {
      // For non-button controls, validate binary code
      const binaryError = validateBinaryCode(binaryCode);
      if (binaryError) {
        toast.error(binaryError);
        return;
      }
    }

    if (controlType === 'radio') {
      for (const option of radioOptions) {
        const optionError = validateBinaryCode(option.binaryCode);
        if (optionError) {
          toast.error(`Radio option "${option.label}": ${optionError}`);
          return;
        }
      }
    }

    if (controlType === 'dial') {
      const increaseError = validateBinaryCode(dialIncreaseBinaryCode);
      if (increaseError) {
        toast.error(`Dial increase code: ${increaseError}`);
        return;
      }
      const decreaseError = validateBinaryCode(dialDecreaseBinaryCode);
      if (decreaseError) {
        toast.error(`Dial decrease code: ${decreaseError}`);
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
      binaryCode: finalBinaryCode,
    };

    if (controlType === 'slider') {
      config.sliderMin = sliderMin;
      config.sliderMax = sliderMax;
      config.sliderIsVertical = sliderIsVertical;
    }

    if (controlType === 'radio') {
      config.radioOptions = radioOptions;
      config.radioGroupIsVertical = radioGroupIsVertical;
    }

    if (controlType === 'dial') {
      config.dialIncreaseBinaryCode = dialIncreaseBinaryCode;
      config.dialDecreaseBinaryCode = dialDecreaseBinaryCode;
    }

    const success = createControlWithConfig(config);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    setRadioOptions([
      ...radioOptions,
      {
        key: newKey,
        label: 'New Option',
        binaryCode: generateDefaultBinaryCode(newKey),
      },
    ]);
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    setRadioOptions(radioOptions.map((opt) => (opt.key === key ? { ...opt, ...updates } : opt)));
  };

  const handleDeleteRadioOption = (key: string) => {
    setRadioOptions(radioOptions.filter((opt) => opt.key !== key));
  };

  const sanitizeBinaryInput = (value: string): string => {
    // Only allow 0 and 1, max 4 characters
    return value.replace(/[^01]/g, '').slice(0, 4);
  };

  const sanitizeDecimalInput = (value: string): string => {
    // Only allow digits
    return value.replace(/[^0-9]/g, '');
  };

  const decimalCodeError = controlType === 'button' ? validateDecimalCode(buttonDecimalCode) : null;

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
            <Select value={controlType} onValueChange={(value) => setControlType(value as ControlType)}>
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

          {controlType === 'button' ? (
            <div className="space-y-2">
              <Label htmlFor="new-buttonCode">Code (1–16)</Label>
              <Input
                id="new-buttonCode"
                type="number"
                min="1"
                max="16"
                value={buttonDecimalCode}
                onChange={(e) => setButtonDecimalCode(sanitizeDecimalInput(e.target.value))}
                placeholder="e.g., 1"
              />
              {decimalCodeError && (
                <p className="text-sm text-destructive">{decimalCodeError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-binaryCode">Binary Code (4 bits)</Label>
              <Input
                id="new-binaryCode"
                value={binaryCode}
                onChange={(e) => setBinaryCode(sanitizeBinaryInput(e.target.value))}
                placeholder="e.g., 1010"
                maxLength={4}
              />
            </div>
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
                      <Input
                        placeholder="Binary Code (4 bits)"
                        value={option.binaryCode}
                        onChange={(e) =>
                          handleUpdateRadioOption(option.key, { binaryCode: sanitizeBinaryInput(e.target.value) })
                        }
                        maxLength={4}
                      />
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {controlType === 'dial' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-dialIncrease">Increase Binary Code (4 bits)</Label>
                <Input
                  id="new-dialIncrease"
                  value={dialIncreaseBinaryCode}
                  onChange={(e) => setDialIncreaseBinaryCode(sanitizeBinaryInput(e.target.value))}
                  placeholder="e.g., 0001"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-dialDecrease">Decrease Binary Code (4 bits)</Label>
                <Input
                  id="new-dialDecrease"
                  value={dialDecreaseBinaryCode}
                  onChange={(e) => setDialDecreaseBinaryCode(sanitizeBinaryInput(e.target.value))}
                  placeholder="e.g., 0010"
                  maxLength={4}
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
