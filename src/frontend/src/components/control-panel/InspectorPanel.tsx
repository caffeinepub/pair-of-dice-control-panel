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
import { decimalToBinary, binaryToDecimal, validateDecimalCode } from '@/lib/buttonCode';
import { toast } from 'sonner';

export function InspectorPanel() {
  const { selectedControl, updateControl, deleteControl, validateId, saveLayout, isSaving } = useControlLayout();

  const [localId, setLocalId] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [localBinaryCode, setLocalBinaryCode] = useState('');
  const [localButtonDecimalCode, setLocalButtonDecimalCode] = useState('1');
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
      
      // Convert binary to decimal for button controls
      if (selectedControl.controlType === 'button') {
        try {
          const decimal = binaryToDecimal(selectedControl.binaryCode);
          setLocalButtonDecimalCode(decimal.toString());
        } catch {
          setLocalButtonDecimalCode('1');
        }
      }
      
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

  const sanitizeDecimalInput = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleButtonDecimalCodeChange = (value: string) => {
    const sanitized = sanitizeDecimalInput(value);
    setLocalButtonDecimalCode(sanitized);
    
    const error = validateDecimalCode(sanitized);
    if (!error && sanitized) {
      try {
        const binary = decimalToBinary(parseInt(sanitized, 10));
        setLocalBinaryCode(binary);
        handleUpdate('binaryCode', binary);
      } catch {
        // Invalid conversion, don't update
      }
    }
  };

  const binaryCodeError = localControlType !== 'button' ? validateBinaryCode(localBinaryCode) : null;
  const buttonDecimalCodeError = localControlType === 'button' ? validateDecimalCode(localButtonDecimalCode) : null;
  const dialIncreaseError = localControlType === 'dial' ? validateBinaryCode(localDialIncreaseBinaryCode) : null;
  const dialDecreaseError = localControlType === 'dial' ? validateBinaryCode(localDialDecreaseBinaryCode) : null;
  const radioOptionErrors = localRadioOptions.map((opt) => validateBinaryCode(opt.binaryCode));
  const hasAnyError = !!(binaryCodeError || buttonDecimalCodeError || dialIncreaseError || dialDecreaseError || radioOptionErrors.some((err) => err));

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

        {localControlType === 'button' ? (
          <div className="space-y-2">
            <Label htmlFor="inspector-buttonCode">Code (1–16)</Label>
            <Input
              id="inspector-buttonCode"
              type="number"
              min="1"
              max="16"
              value={localButtonDecimalCode}
              onChange={(e) => handleButtonDecimalCodeChange(e.target.value)}
            />
            {buttonDecimalCodeError && (
              <p className="text-sm text-destructive">{buttonDecimalCodeError}</p>
            )}
          </div>
        ) : (
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
              maxLength={4}
            />
            {binaryCodeError && (
              <p className="text-sm text-destructive">{binaryCodeError}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector-x">X</Label>
            <Input
              id="inspector-x"
              type="number"
              value={localX}
              onChange={(e) => {
                setLocalX(Number(e.target.value));
                handleUpdate('x', Number(e.target.value));
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
                setLocalY(Number(e.target.value));
                handleUpdate('y', Number(e.target.value));
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
                setLocalWidth(Number(e.target.value));
                handleUpdate('width', Number(e.target.value));
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
                setLocalHeight(Number(e.target.value));
                handleUpdate('height', Number(e.target.value));
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-color">Color</Label>
          <Input
            id="inspector-color"
            value={localColor}
            onChange={(e) => {
              setLocalColor(e.target.value);
              handleUpdate('color', e.target.value);
            }}
          />
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
                    setLocalSliderMin(Number(e.target.value));
                    handleUpdate('sliderMin', Number(e.target.value));
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
                    setLocalSliderMax(Number(e.target.value));
                    handleUpdate('sliderMax', Number(e.target.value));
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
                {localRadioOptions.map((option, idx) => (
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
                    <div className="space-y-1">
                      <Input
                        placeholder="Binary Code (4 bits)"
                        value={option.binaryCode}
                        onChange={(e) =>
                          handleUpdateRadioOption(option.key, { binaryCode: sanitizeBinaryInput(e.target.value) })
                        }
                        maxLength={4}
                      />
                      {radioOptionErrors[idx] && (
                        <p className="text-xs text-destructive">{radioOptionErrors[idx]}</p>
                      )}
                    </div>
                  </Card>
                ))}
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
                maxLength={4}
              />
              {dialIncreaseError && (
                <p className="text-sm text-destructive">{dialIncreaseError}</p>
              )}
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
                maxLength={4}
              />
              {dialDecreaseError && (
                <p className="text-sm text-destructive">{dialDecreaseError}</p>
              )}
            </div>
          </>
        )}

        <div className="pt-4 space-y-2">
          <Button
            onClick={saveLayout}
            disabled={isSaving || hasAnyError}
            className="w-full"
          >
            {isSaving ? 'Saving...' : hasAnyError ? 'Fix validation errors' : 'Save Layout'}
          </Button>
          <Button onClick={handleDelete} variant="destructive" className="w-full">
            Delete Control
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
