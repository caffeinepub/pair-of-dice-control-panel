import { useEffect, useState } from 'react';
import { useControlLayout } from '@/hooks/useControlLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import type { ControlType, RadioOption } from '@/types/controlPanel';
import { validateBinaryCode, generateDefaultBinaryCode } from '@/lib/binaryCode';
import { toast } from 'sonner';

export function InspectorPanel() {
  const { selectedControl, updateControl, deleteControl, validateId, saveLayout, isSaving } = useControlLayout();

  const [localId, setLocalId] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [localBinaryCode, setLocalBinaryCode] = useState('');
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [localHeight, setLocalHeight] = useState(0);
  const [localColor, setLocalColor] = useState('');
  const [localControlType, setLocalControlType] = useState<ControlType>('button');
  const [localSliderMin, setLocalSliderMin] = useState(0);
  const [localSliderMax, setLocalSliderMax] = useState(100);
  const [localSliderIsVertical, setLocalSliderIsVertical] = useState(false);
  const [localRadioOptions, setLocalRadioOptions] = useState<RadioOption[]>([]);
  const [localRadioGroupIsVertical, setLocalRadioGroupIsVertical] = useState(true);
  const [localDialIncreaseBinaryCode, setLocalDialIncreaseBinaryCode] = useState('');
  const [localDialDecreaseBinaryCode, setLocalDialDecreaseBinaryCode] = useState('');

  useEffect(() => {
    if (selectedControl) {
      setLocalId(selectedControl.id);
      setLocalLabel(selectedControl.label);
      setLocalBinaryCode(selectedControl.binaryCode);
      setLocalX(selectedControl.x);
      setLocalY(selectedControl.y);
      setLocalWidth(selectedControl.width);
      setLocalHeight(selectedControl.height);
      setLocalColor(selectedControl.color);
      setLocalControlType(selectedControl.controlType);
      setLocalSliderMin(selectedControl.sliderMin ?? 0);
      setLocalSliderMax(selectedControl.sliderMax ?? 100);
      setLocalSliderIsVertical(selectedControl.sliderIsVertical ?? false);
      setLocalRadioOptions(selectedControl.radioOptions ?? []);
      setLocalRadioGroupIsVertical(selectedControl.radioGroupIsVertical ?? true);
      setLocalDialIncreaseBinaryCode(selectedControl.dialIncreaseBinaryCode ?? '0001');
      setLocalDialDecreaseBinaryCode(selectedControl.dialDecreaseBinaryCode ?? '0010');
    }
  }, [selectedControl]);

  if (!selectedControl) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a control to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (field: string, value: any) => {
    updateControl(selectedControl.id, { [field]: value });
  };

  const handleIdChange = (newId: string) => {
    setLocalId(newId);
    const error = validateId(newId, selectedControl.id);
    if (!error) {
      handleUpdate('id', newId);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete control "${selectedControl.label}"?`)) {
      deleteControl(selectedControl.id);
    }
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const newOptions = [
      ...localRadioOptions,
      {
        key: newKey,
        label: 'New Option',
        binaryCode: generateDefaultBinaryCode(newKey),
      },
    ];
    setLocalRadioOptions(newOptions);
    handleUpdate('radioOptions', newOptions);
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    const newOptions = localRadioOptions.map((opt) => (opt.key === key ? { ...opt, ...updates } : opt));
    setLocalRadioOptions(newOptions);
    handleUpdate('radioOptions', newOptions);
  };

  const handleDeleteRadioOption = (key: string) => {
    const newOptions = localRadioOptions.filter((opt) => opt.key !== key);
    setLocalRadioOptions(newOptions);
    handleUpdate('radioOptions', newOptions);
  };

  const sanitizeBinaryInput = (value: string): string => {
    return value.replace(/[^01]/g, '').slice(0, 4);
  };

  const binaryCodeError = validateBinaryCode(localBinaryCode);
  const dialIncreaseError = localControlType === 'dial' ? validateBinaryCode(localDialIncreaseBinaryCode) : null;
  const dialDecreaseError = localControlType === 'dial' ? validateBinaryCode(localDialDecreaseBinaryCode) : null;
  const radioOptionErrors = localRadioOptions.map((opt) => validateBinaryCode(opt.binaryCode));
  const hasAnyError = !!(binaryCodeError || dialIncreaseError || dialDecreaseError || radioOptionErrors.some((err) => err));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Inspector</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inspector-id">ID</Label>
          <Input id="inspector-id" value={localId} onChange={(e) => handleIdChange(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-label">Label</Label>
          <Input
            id="inspector-label"
            value={localLabel}
            onChange={(e) => {
              setLocalLabel(e.target.value);
              handleUpdate('label', e.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-type">Control Type</Label>
          <Select
            value={localControlType}
            onValueChange={(value) => {
              setLocalControlType(value as ControlType);
              handleUpdate('controlType', value);
            }}
          >
            <SelectTrigger id="inspector-type">
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

        <div className="space-y-2">
          <Label htmlFor="inspector-binaryCode">Binary Code (4 bits)</Label>
          <Input
            id="inspector-binaryCode"
            value={localBinaryCode}
            onChange={(e) => {
              const sanitized = sanitizeBinaryInput(e.target.value);
              setLocalBinaryCode(sanitized);
              handleUpdate('binaryCode', sanitized);
            }}
            placeholder="e.g., 1010"
            maxLength={4}
            className={binaryCodeError ? 'border-destructive' : ''}
          />
          {binaryCodeError && <p className="text-xs text-destructive">{binaryCodeError}</p>}
        </div>

        {localControlType === 'slider' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="inspector-sliderOrientation">Orientation</Label>
              <Select
                value={localSliderIsVertical ? 'vertical' : 'horizontal'}
                onValueChange={(value) => {
                  const isVertical = value === 'vertical';
                  setLocalSliderIsVertical(isVertical);
                  handleUpdate('sliderIsVertical', isVertical);
                }}
              >
                <SelectTrigger id="inspector-sliderOrientation">
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
                <Label htmlFor="inspector-sliderMin">Min</Label>
                <Input
                  id="inspector-sliderMin"
                  type="number"
                  value={localSliderMin}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalSliderMin(value);
                    handleUpdate('sliderMin', value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspector-sliderMax">Max</Label>
                <Input
                  id="inspector-sliderMax"
                  type="number"
                  value={localSliderMax}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalSliderMax(value);
                    handleUpdate('sliderMax', value);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {localControlType === 'radio' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="inspector-radioOrientation">Orientation</Label>
              <Select
                value={localRadioGroupIsVertical ? 'vertical' : 'horizontal'}
                onValueChange={(value) => {
                  const isVertical = value === 'vertical';
                  setLocalRadioGroupIsVertical(isVertical);
                  handleUpdate('radioGroupIsVertical', isVertical);
                }}
              >
                <SelectTrigger id="inspector-radioOrientation">
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
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {localRadioOptions.map((option, idx) => {
                  const optionError = radioOptionErrors[idx];
                  return (
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
                          disabled={localRadioOptions.length <= 1}
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
                        className={optionError ? 'border-destructive' : ''}
                      />
                      {optionError && <p className="text-xs text-destructive">{optionError}</p>}
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {localControlType === 'dial' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="inspector-dialIncrease">Increase Binary Code (4 bits)</Label>
              <Input
                id="inspector-dialIncrease"
                value={localDialIncreaseBinaryCode}
                onChange={(e) => {
                  const sanitized = sanitizeBinaryInput(e.target.value);
                  setLocalDialIncreaseBinaryCode(sanitized);
                  handleUpdate('dialIncreaseBinaryCode', sanitized);
                }}
                placeholder="e.g., 0001"
                maxLength={4}
                className={dialIncreaseError ? 'border-destructive' : ''}
              />
              {dialIncreaseError && <p className="text-xs text-destructive">{dialIncreaseError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector-dialDecrease">Decrease Binary Code (4 bits)</Label>
              <Input
                id="inspector-dialDecrease"
                value={localDialDecreaseBinaryCode}
                onChange={(e) => {
                  const sanitized = sanitizeBinaryInput(e.target.value);
                  setLocalDialDecreaseBinaryCode(sanitized);
                  handleUpdate('dialDecreaseBinaryCode', sanitized);
                }}
                placeholder="e.g., 0010"
                maxLength={4}
                className={dialDecreaseError ? 'border-destructive' : ''}
              />
              {dialDecreaseError && <p className="text-xs text-destructive">{dialDecreaseError}</p>}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector-x">X</Label>
            <Input
              id="inspector-x"
              type="number"
              value={localX}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLocalX(value);
                handleUpdate('x', value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspector-y">Y</Label>
            <Input
              id="inspector-y"
              type="number"
              value={localY}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLocalY(value);
                handleUpdate('y', value);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector-width">Width</Label>
            <Input
              id="inspector-width"
              type="number"
              value={localWidth}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLocalWidth(value);
                handleUpdate('width', value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspector-height">Height</Label>
            <Input
              id="inspector-height"
              type="number"
              value={localHeight}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLocalHeight(value);
                handleUpdate('height', value);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-color">Color</Label>
          <div className="flex gap-2">
            <Input
              id="inspector-color"
              type="color"
              value={localColor}
              onChange={(e) => {
                setLocalColor(e.target.value);
                handleUpdate('color', e.target.value);
              }}
              className="w-20 h-10"
            />
            <Input
              value={localColor}
              onChange={(e) => {
                setLocalColor(e.target.value);
                handleUpdate('color', e.target.value);
              }}
              placeholder="#000000"
            />
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <Button
            onClick={saveLayout}
            disabled={isSaving || hasAnyError}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
          </Button>
          {hasAnyError && (
            <p className="text-xs text-destructive text-center">
              Fix validation errors before saving
            </p>
          )}
          <Button onClick={handleDelete} variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Control
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
