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
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [radioOptions, setRadioOptions] = useState<RadioOption[]>([
    { key: 'option_1', label: 'Option 1', binaryCode: '0001' },
    { key: 'option_2', label: 'Option 2', binaryCode: '0010' },
  ]);
  const [radioGroupIsVertical, setRadioGroupIsVertical] = useState(true);

  const resetForm = () => {
    const newId = `control_${Date.now()}`;
    setId(newId);
    setLabel('New Control');
    setBinaryCode(generateDefaultBinaryCode(newId));
    setControlType('button');
    setSliderMin(0);
    setSliderMax(100);
    setRadioOptions([
      { key: 'option_1', label: 'Option 1', binaryCode: '0001' },
      { key: 'option_2', label: 'Option 2', binaryCode: '0010' },
    ]);
    setRadioGroupIsVertical(true);
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

    const binaryError = validateBinaryCode(binaryCode);
    if (binaryError) {
      toast.error(binaryError);
      return;
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
      binaryCode,
    };

    if (controlType === 'slider') {
      config.sliderMin = sliderMin;
      config.sliderMax = sliderMax;
    }

    if (controlType === 'radio') {
      config.radioOptions = radioOptions;
      config.radioGroupIsVertical = radioGroupIsVertical;
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-binaryCode">Binary Code</Label>
            <Input
              id="new-binaryCode"
              value={binaryCode}
              onChange={(e) => setBinaryCode(e.target.value)}
              placeholder="e.g., 10101010"
            />
          </div>

          {controlType === 'slider' && (
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
                  <Button size="sm" variant="outline" onClick={handleAddRadioOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-3">
                  {radioOptions.map((option) => (
                    <Card key={option.key} className="p-3">
                      <div className="space-y-2">
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => handleUpdateRadioOption(option.key, { label: e.target.value })}
                        />
                        <Input
                          placeholder="Binary Code"
                          value={option.binaryCode}
                          onChange={(e) => handleUpdateRadioOption(option.key, { binaryCode: e.target.value })}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRadioOption(option.key)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
