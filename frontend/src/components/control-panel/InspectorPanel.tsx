import { useEffect, useState } from 'react';
import { useControlLayout } from '@/hooks/useControlLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
import type { ControlType, RadioOption } from '@/types/controlPanel';
import { validateDecimalCode } from '@/lib/buttonCode';
import { toast } from 'sonner';
import { ImportExportPanel } from './ImportExportPanel';

export function InspectorPanel() {
  const { selectedControl, updateControl, deleteControl, validateId, saveLayout, isSaving } = useControlLayout();

  const [localId, setLocalId] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [localDecimalCode, setLocalDecimalCode] = useState('1');
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [localHeight, setLocalHeight] = useState(0);
  const [localColor, setLocalColor] = useState('');
  const [localControlType, setLocalControlType] = useState<ControlType>('button');
  
  // Toggle dual codes
  const [localDecimalCodeOn, setLocalDecimalCodeOn] = useState('');
  const [localDecimalCodeOff, setLocalDecimalCodeOff] = useState('');
  
  // Slider config and dual codes
  const [localSliderMin, setLocalSliderMin] = useState(0);
  const [localSliderMax, setLocalSliderMax] = useState(100);
  const [localSliderIsVertical, setLocalSliderIsVertical] = useState(false);
  const [localDecimalCodeUp, setLocalDecimalCodeUp] = useState('');
  const [localDecimalCodeDown, setLocalDecimalCodeDown] = useState('');
  
  // Radio config
  const [localRadioOptions, setLocalRadioOptions] = useState<RadioOption[]>([]);
  const [localRadioGroupIsVertical, setLocalRadioGroupIsVertical] = useState(true);
  
  // Dial dual codes
  const [localDecimalCodeLeft, setLocalDecimalCodeLeft] = useState('');
  const [localDecimalCodeRight, setLocalDecimalCodeRight] = useState('');

  useEffect(() => {
    if (selectedControl) {
      setLocalId(selectedControl.id);
      setLocalLabel(selectedControl.label);
      setLocalDecimalCode((selectedControl.decimalCode || 1).toString());
      setLocalX(selectedControl.x);
      setLocalY(selectedControl.y);
      setLocalWidth(selectedControl.width);
      setLocalHeight(selectedControl.height);
      setLocalColor(selectedControl.color);
      setLocalControlType(selectedControl.controlType);

      // Toggle dual codes
      setLocalDecimalCodeOn((selectedControl.decimalCodeOn || 1).toString());
      setLocalDecimalCodeOff((selectedControl.decimalCodeOff || 2).toString());

      // Slider config and dual codes
      setLocalSliderMin(selectedControl.sliderMin ?? 0);
      setLocalSliderMax(selectedControl.sliderMax ?? 100);
      setLocalSliderIsVertical(selectedControl.sliderIsVertical ?? false);
      setLocalDecimalCodeUp((selectedControl.decimalCodeUp || 1).toString());
      setLocalDecimalCodeDown((selectedControl.decimalCodeDown || 2).toString());

      // Radio config
      setLocalRadioOptions(selectedControl.radioOptions || []);
      setLocalRadioGroupIsVertical(selectedControl.radioGroupIsVertical ?? true);

      // Dial dual codes
      setLocalDecimalCodeLeft((selectedControl.decimalCodeLeft || 1).toString());
      setLocalDecimalCodeRight((selectedControl.decimalCodeRight || 2).toString());
    }
  }, [selectedControl]);

  if (!selectedControl) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Select a control to edit its properties</p>
          </CardContent>
        </Card>
        
        <Separator />
        <ImportExportPanel />
      </div>
    );
  }

  const handleUpdate = () => {
    const idError = validateId(localId, selectedControl.id);
    if (idError) {
      toast.error(idError);
      return;
    }

    // Validate decimal codes based on control type
    if (localControlType === 'button' || localControlType === 'radio') {
      const error = validateDecimalCode(localDecimalCode);
      if (error) {
        toast.error(error);
        return;
      }
    }

    if (localControlType === 'radio') {
      // Validate all radio option decimal codes
      for (const option of localRadioOptions) {
        const error = validateDecimalCode(option.decimalCode.toString());
        if (error) {
          toast.error(`Radio option "${option.label}": ${error}`);
          return;
        }
      }
    }

    if (localControlType === 'toggle') {
      const onError = validateDecimalCode(localDecimalCodeOn);
      if (onError) {
        toast.error(`Toggle ON code: ${onError}`);
        return;
      }
      const offError = validateDecimalCode(localDecimalCodeOff);
      if (offError) {
        toast.error(`Toggle OFF code: ${offError}`);
        return;
      }
    }

    if (localControlType === 'slider') {
      const upError = validateDecimalCode(localDecimalCodeUp);
      if (upError) {
        toast.error(`Slider UP code: ${upError}`);
        return;
      }
      const downError = validateDecimalCode(localDecimalCodeDown);
      if (downError) {
        toast.error(`Slider DOWN code: ${downError}`);
        return;
      }
    }

    if (localControlType === 'dial') {
      const leftError = validateDecimalCode(localDecimalCodeLeft);
      if (leftError) {
        toast.error(`Dial LEFT code: ${leftError}`);
        return;
      }
      const rightError = validateDecimalCode(localDecimalCodeRight);
      if (rightError) {
        toast.error(`Dial RIGHT code: ${rightError}`);
        return;
      }
    }

    const updates: Partial<typeof selectedControl> = {
      id: localId,
      label: localLabel,
      x: localX,
      y: localY,
      width: localWidth,
      height: localHeight,
      color: localColor,
    };

    if (localControlType === 'button' || localControlType === 'radio') {
      updates.decimalCode = parseInt(localDecimalCode, 10);
    }

    if (localControlType === 'toggle') {
      updates.decimalCodeOn = parseInt(localDecimalCodeOn, 10);
      updates.decimalCodeOff = parseInt(localDecimalCodeOff, 10);
    }

    if (localControlType === 'slider') {
      updates.sliderMin = localSliderMin;
      updates.sliderMax = localSliderMax;
      updates.sliderIsVertical = localSliderIsVertical;
      updates.decimalCodeUp = parseInt(localDecimalCodeUp, 10);
      updates.decimalCodeDown = parseInt(localDecimalCodeDown, 10);
    }

    if (localControlType === 'radio') {
      updates.radioOptions = localRadioOptions;
      updates.radioGroupIsVertical = localRadioGroupIsVertical;
    }

    if (localControlType === 'dial') {
      updates.decimalCodeLeft = parseInt(localDecimalCodeLeft, 10);
      updates.decimalCodeRight = parseInt(localDecimalCodeRight, 10);
    }

    updateControl(selectedControl.id, updates);
  };

  const handleDelete = () => {
    if (confirm(`Delete control "${selectedControl.label}"?`)) {
      deleteControl(selectedControl.id);
    }
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const nextCode = localRadioOptions.length > 0 
      ? Math.min(16, Math.max(...localRadioOptions.map(o => o.decimalCode)) + 1)
      : 1;
    setLocalRadioOptions([
      ...localRadioOptions,
      {
        key: newKey,
        label: 'New Option',
        decimalCode: nextCode,
      },
    ]);
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    setLocalRadioOptions(localRadioOptions.map((opt) => (opt.key === key ? { ...opt, ...updates } : opt)));
  };

  const handleDeleteRadioOption = (key: string) => {
    setLocalRadioOptions(localRadioOptions.filter((opt) => opt.key !== key));
  };

  const sanitizeDecimalInput = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inspector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-id">ID</Label>
            <Input id="edit-id" value={localId} onChange={(e) => setLocalId(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-label">Label</Label>
            <Input id="edit-label" value={localLabel} onChange={(e) => setLocalLabel(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-x">X</Label>
              <Input id="edit-x" type="number" value={localX} onChange={(e) => setLocalX(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-y">Y</Label>
              <Input id="edit-y" type="number" value={localY} onChange={(e) => setLocalY(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-width">Width</Label>
              <Input id="edit-width" type="number" value={localWidth} onChange={(e) => setLocalWidth(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-height">Height</Label>
              <Input id="edit-height" type="number" value={localHeight} onChange={(e) => setLocalHeight(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-color">Color</Label>
            <Input id="edit-color" type="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} />
          </div>

          {(localControlType === 'button' || localControlType === 'radio') && (
            <div className="space-y-2">
              <Label htmlFor="edit-decimalCode">Decimal Code (1–16)</Label>
              <Input
                id="edit-decimalCode"
                type="number"
                min="1"
                max="16"
                value={localDecimalCode}
                onChange={(e) => setLocalDecimalCode(sanitizeDecimalInput(e.target.value))}
              />
            </div>
          )}

          {localControlType === 'toggle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-toggleOn">ON Code (1–16)</Label>
                <Input
                  id="edit-toggleOn"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeOn}
                  onChange={(e) => setLocalDecimalCodeOn(sanitizeDecimalInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-toggleOff">OFF Code (1–16)</Label>
                <Input
                  id="edit-toggleOff"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeOff}
                  onChange={(e) => setLocalDecimalCodeOff(sanitizeDecimalInput(e.target.value))}
                />
              </div>
            </>
          )}

          {localControlType === 'slider' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sliderMin">Min</Label>
                  <Input
                    id="edit-sliderMin"
                    type="number"
                    value={localSliderMin}
                    onChange={(e) => setLocalSliderMin(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sliderMax">Max</Label>
                  <Input
                    id="edit-sliderMax"
                    type="number"
                    value={localSliderMax}
                    onChange={(e) => setLocalSliderMax(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sliderVertical" className="flex items-center gap-2">
                  <input
                    id="edit-sliderVertical"
                    type="checkbox"
                    checked={localSliderIsVertical}
                    onChange={(e) => setLocalSliderIsVertical(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Vertical Orientation
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sliderUp">UP Code (1–16)</Label>
                <Input
                  id="edit-sliderUp"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeUp}
                  onChange={(e) => setLocalDecimalCodeUp(sanitizeDecimalInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sliderDown">DOWN Code (1–16)</Label>
                <Input
                  id="edit-sliderDown"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeDown}
                  onChange={(e) => setLocalDecimalCodeDown(sanitizeDecimalInput(e.target.value))}
                />
              </div>
            </>
          )}

          {localControlType === 'radio' && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localRadioGroupIsVertical}
                    onChange={(e) => setLocalRadioGroupIsVertical(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Vertical Layout
                </Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Radio Options</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddRadioOption}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {localRadioOptions.map((option) => (
                    <div key={option.key} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => handleUpdateRadioOption(option.key, { label: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        max="16"
                        placeholder="Code"
                        value={option.decimalCode}
                        onChange={(e) =>
                          handleUpdateRadioOption(option.key, {
                            decimalCode: parseInt(sanitizeDecimalInput(e.target.value) || '1', 10),
                          })
                        }
                        className="w-20"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRadioOption(option.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {localControlType === 'dial' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-dialLeft">LEFT Code (1–16)</Label>
                <Input
                  id="edit-dialLeft"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeLeft}
                  onChange={(e) => setLocalDecimalCodeLeft(sanitizeDecimalInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dialRight">RIGHT Code (1–16)</Label>
                <Input
                  id="edit-dialRight"
                  type="number"
                  min="1"
                  max="16"
                  value={localDecimalCodeRight}
                  onChange={(e) => setLocalDecimalCodeRight(sanitizeDecimalInput(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdate} disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : 'Update'}
            </Button>
            <Button onClick={handleDelete} variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <ImportExportPanel />
    </div>
  );
}
