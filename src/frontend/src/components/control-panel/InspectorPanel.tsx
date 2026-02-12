import { useState, useEffect } from 'react';
import { useControlLayout } from '@/hooks/useControlLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { validateBinaryCode, generateDefaultBinaryCode } from '@/lib/binaryCode';
import { getControlDefaults } from '@/lib/controlDefaults';
import type { ControlType, RadioOption } from '@/types/controlPanel';
import { Trash2, Plus, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export function InspectorPanel() {
  const { selectedControl, updateControl, deleteControl, validateId, saveLayout, isSaving } = useControlLayout();

  const [localId, setLocalId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const [localBinaryCode, setLocalBinaryCode] = useState('');
  const [binaryCodeError, setBinaryCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedControl) {
      setLocalId(selectedControl.id);
      setIdError(null);
      setLocalBinaryCode(selectedControl.binaryCode);
      setBinaryCodeError(null);
    }
  }, [selectedControl?.id, selectedControl?.binaryCode]);

  if (!selectedControl) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Terminal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a control in the workspace to edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleIdChange = (newId: string) => {
    setLocalId(newId);
    const error = validateId(newId, selectedControl.id);
    setIdError(error);
    if (!error) {
      updateControl(selectedControl.id, { id: newId });
    }
  };

  const handleBinaryCodeChange = (newCode: string) => {
    // Sanitize input: only 0 and 1, max 4 characters
    const sanitized = newCode.replace(/[^01]/g, '').slice(0, 4);
    setLocalBinaryCode(sanitized);
    
    // Validate only if user has entered 4 characters
    if (sanitized.length === 4) {
      const error = validateBinaryCode(sanitized);
      setBinaryCodeError(error);
      if (!error) {
        updateControl(selectedControl.id, { binaryCode: sanitized });
      }
    } else if (sanitized.length === 0) {
      setBinaryCodeError('Binary code cannot be empty');
    } else {
      setBinaryCodeError('Binary code must be exactly 4 characters');
    }
  };

  const handleTypeChange = (newType: ControlType) => {
    const defaults = getControlDefaults(newType);
    updateControl(selectedControl.id, {
      ...defaults,
      controlType: newType,
      id: selectedControl.id,
      label: selectedControl.label,
      x: selectedControl.x,
      y: selectedControl.y,
      binaryCode: selectedControl.binaryCode,
    });
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const newOption: RadioOption = {
      key: newKey,
      label: 'New Option',
      binaryCode: generateDefaultBinaryCode(newKey),
    };
    updateControl(selectedControl.id, {
      radioOptions: [...(selectedControl.radioOptions || []), newOption],
    });
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    const updatedOptions = selectedControl.radioOptions?.map((opt) =>
      opt.key === key ? { ...opt, ...updates } : opt
    );
    updateControl(selectedControl.id, { radioOptions: updatedOptions });
  };

  const handleDeleteRadioOption = (key: string) => {
    const updatedOptions = selectedControl.radioOptions?.filter((opt) => opt.key !== key);
    updateControl(selectedControl.id, { radioOptions: updatedOptions });
  };

  const sanitizeBinaryInput = (value: string): string => {
    // Only allow 0 and 1, max 4 characters
    return value.replace(/[^01]/g, '').slice(0, 4);
  };

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Terminal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inspector-id">ID</Label>
          <Input
            id="inspector-id"
            value={localId}
            onChange={(e) => handleIdChange(e.target.value)}
            className={idError ? 'border-destructive' : ''}
          />
          {idError && <p className="text-xs text-destructive">{idError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-label">Label</Label>
          <Input
            id="inspector-label"
            value={selectedControl.label}
            onChange={(e) => updateControl(selectedControl.id, { label: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-type">Control Type</Label>
          <Select value={selectedControl.controlType} onValueChange={handleTypeChange}>
            <SelectTrigger id="inspector-type">
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

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector-x">X</Label>
            <Input
              id="inspector-x"
              type="number"
              value={selectedControl.x}
              onChange={(e) => updateControl(selectedControl.id, { x: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspector-y">Y</Label>
            <Input
              id="inspector-y"
              type="number"
              value={selectedControl.y}
              onChange={(e) => updateControl(selectedControl.id, { y: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector-width">Width</Label>
            <Input
              id="inspector-width"
              type="number"
              value={selectedControl.width}
              onChange={(e) => updateControl(selectedControl.id, { width: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspector-height">Height</Label>
            <Input
              id="inspector-height"
              type="number"
              value={selectedControl.height}
              onChange={(e) => updateControl(selectedControl.id, { height: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-color">Color</Label>
          <Input
            id="inspector-color"
            type="color"
            value={selectedControl.color}
            onChange={(e) => updateControl(selectedControl.id, { color: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-binaryCode">Binary Code (4 bits)</Label>
          <Input
            id="inspector-binaryCode"
            value={localBinaryCode}
            onChange={(e) => handleBinaryCodeChange(e.target.value)}
            placeholder="e.g., 1010"
            maxLength={4}
            className={binaryCodeError ? 'border-destructive' : ''}
          />
          {binaryCodeError && <p className="text-xs text-destructive">{binaryCodeError}</p>}
        </div>

        {selectedControl.controlType === 'slider' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="inspector-sliderOrientation">Orientation</Label>
              <Select
                value={selectedControl.sliderIsVertical ? 'vertical' : 'horizontal'}
                onValueChange={(value) =>
                  updateControl(selectedControl.id, { sliderIsVertical: value === 'vertical' })
                }
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
                  value={selectedControl.sliderMin}
                  onChange={(e) => updateControl(selectedControl.id, { sliderMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspector-sliderMax">Max</Label>
                <Input
                  id="inspector-sliderMax"
                  type="number"
                  value={selectedControl.sliderMax}
                  onChange={(e) => updateControl(selectedControl.id, { sliderMax: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        )}

        {selectedControl.controlType === 'radio' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="inspector-radioOrientation">Orientation</Label>
              <Select
                value={selectedControl.radioGroupIsVertical ? 'vertical' : 'horizontal'}
                onValueChange={(value) =>
                  updateControl(selectedControl.id, { radioGroupIsVertical: value === 'vertical' })
                }
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
                <Button size="sm" variant="outline" onClick={handleAddRadioOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {selectedControl.radioOptions?.map((option) => (
                  <Card key={option.key} className="p-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => handleUpdateRadioOption(option.key, { label: e.target.value })}
                      />
                      <Input
                        placeholder="Binary Code (4 bits)"
                        value={option.binaryCode}
                        onChange={(e) =>
                          handleUpdateRadioOption(option.key, {
                            binaryCode: sanitizeBinaryInput(e.target.value),
                          })
                        }
                        maxLength={4}
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

        <Separator />

        <Button onClick={saveLayout} disabled={isSaving || !!idError || !!binaryCodeError} className="w-full">
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>

        <Button variant="destructive" onClick={() => deleteControl(selectedControl.id)} className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Control
        </Button>
      </CardContent>
    </Card>
  );
}
