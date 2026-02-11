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
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function InspectorPanel() {
  const { selectedControl, updateControl, deleteControl, validateId, saveLayout, isSaving } = useControlLayout();

  const [localId, setLocalId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedControl) {
      setLocalId(selectedControl.id);
      setIdError(null);
    }
  }, [selectedControl]);

  if (!selectedControl) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a control to edit its properties</p>
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

  const handleTypeChange = (newType: ControlType) => {
    const defaults = getControlDefaults(newType);
    updateControl(selectedControl.id, {
      ...defaults,
      controlType: newType,
      id: selectedControl.id,
      binaryCode: selectedControl.binaryCode,
    });
  };

  const handleBinaryCodeChange = (code: string) => {
    updateControl(selectedControl.id, { binaryCode: code });
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const newOption: RadioOption = {
      key: newKey,
      label: 'New Option',
      binaryCode: generateDefaultBinaryCode(newKey),
    };
    const newOptions = [...(selectedControl.radioOptions || []), newOption];
    updateControl(selectedControl.id, { radioOptions: newOptions });
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    const newOptions = selectedControl.radioOptions?.map((opt) =>
      opt.key === key ? { ...opt, ...updates } : opt
    );
    updateControl(selectedControl.id, { radioOptions: newOptions });
  };

  const handleDeleteRadioOption = (key: string) => {
    const newOptions = selectedControl.radioOptions?.filter((opt) => opt.key !== key);
    updateControl(selectedControl.id, { radioOptions: newOptions });
  };

  const handleDelete = () => {
    if (confirm(`Delete control "${selectedControl.label}"?`)) {
      deleteControl(selectedControl.id);
      toast.success('Control deleted');
    }
  };

  const binaryError = validateBinaryCode(selectedControl.binaryCode);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Inspector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID */}
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            value={localId}
            onChange={(e) => handleIdChange(e.target.value)}
            className={idError ? 'border-destructive' : ''}
          />
          {idError && <p className="text-xs text-destructive">{idError}</p>}
        </div>

        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={selectedControl.label}
            onChange={(e) => updateControl(selectedControl.id, { label: e.target.value })}
          />
        </div>

        {/* Control Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Control Type</Label>
          <Select value={selectedControl.controlType} onValueChange={handleTypeChange}>
            <SelectTrigger id="type">
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

        {/* Position */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="x">X Position</Label>
            <Input
              id="x"
              type="number"
              value={selectedControl.x}
              onChange={(e) => updateControl(selectedControl.id, { x: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="y">Y Position</Label>
            <Input
              id="y"
              type="number"
              value={selectedControl.y}
              onChange={(e) => updateControl(selectedControl.id, { y: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              value={selectedControl.width}
              onChange={(e) => updateControl(selectedControl.id, { width: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              value={selectedControl.height}
              onChange={(e) => updateControl(selectedControl.id, { height: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={selectedControl.color}
              onChange={(e) => updateControl(selectedControl.id, { color: e.target.value })}
              className="h-10 w-20"
            />
            <Input
              value={selectedControl.color}
              onChange={(e) => updateControl(selectedControl.id, { color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <Separator />

        {/* Binary Code */}
        <div className="space-y-2">
          <Label htmlFor="binaryCode">Binary Code</Label>
          <Input
            id="binaryCode"
            value={selectedControl.binaryCode}
            onChange={(e) => handleBinaryCodeChange(e.target.value)}
            className={binaryError ? 'border-destructive' : ''}
            placeholder="e.g., 10101010"
          />
          {binaryError && <p className="text-xs text-destructive">{binaryError}</p>}
        </div>

        {/* Type-specific settings */}
        {selectedControl.controlType === 'slider' && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sliderMin">Min</Label>
                <Input
                  id="sliderMin"
                  type="number"
                  value={selectedControl.sliderMin ?? 0}
                  onChange={(e) => updateControl(selectedControl.id, { sliderMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sliderMax">Max</Label>
                <Input
                  id="sliderMax"
                  type="number"
                  value={selectedControl.sliderMax ?? 100}
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
                        placeholder="Binary Code"
                        value={option.binaryCode}
                        onChange={(e) => handleUpdateRadioOption(option.key, { binaryCode: e.target.value })}
                        className={validateBinaryCode(option.binaryCode) ? 'border-destructive' : ''}
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={saveLayout} disabled={isSaving || !!idError || !!binaryError} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Layout'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
