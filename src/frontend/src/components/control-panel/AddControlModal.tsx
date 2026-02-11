import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { ControlType, RadioOption } from '@/types/controlPanel';
import { getControlDefaults } from '@/lib/controlDefaults';
import { validateBinaryCode, generateDefaultBinaryCode } from '@/lib/binaryCode';

interface AddControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateControl: (config: ControlDraft) => void;
  validateId: (id: string) => string | null;
}

export interface ControlDraft {
  id: string;
  label: string;
  controlType: ControlType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  binaryCode: string;
  sliderMin?: number;
  sliderMax?: number;
  radioOptions?: RadioOption[];
}

export function AddControlModal({ open, onOpenChange, onCreateControl, validateId }: AddControlModalProps) {
  const [draft, setDraft] = useState<ControlDraft>(getInitialDraft());
  const [idError, setIdError] = useState<string | null>(null);
  const [binaryError, setBinaryError] = useState<string | null>(null);

  // Reset draft when modal opens
  useEffect(() => {
    if (open) {
      setDraft(getInitialDraft());
      setIdError(null);
      setBinaryError(null);
    }
  }, [open]);

  function getInitialDraft(): ControlDraft {
    const newId = `control_${Date.now()}`;
    const defaults = getControlDefaults('button');
    return {
      id: newId,
      label: defaults.label,
      controlType: 'button',
      x: defaults.x,
      y: defaults.y,
      width: defaults.width,
      height: defaults.height,
      color: defaults.color,
      binaryCode: generateDefaultBinaryCode(newId),
    };
  }

  const handleIdChange = (newId: string) => {
    setDraft((prev) => ({ ...prev, id: newId }));
    const error = validateId(newId);
    setIdError(error);
  };

  const handleBinaryCodeChange = (code: string) => {
    setDraft((prev) => ({ ...prev, binaryCode: code }));
    const error = validateBinaryCode(code);
    setBinaryError(error);
  };

  const handleTypeChange = (newType: ControlType) => {
    const defaults = getControlDefaults(newType);
    setDraft((prev) => ({
      ...prev,
      controlType: newType,
      width: defaults.width,
      height: defaults.height,
      sliderMin: 'sliderMin' in defaults ? defaults.sliderMin : undefined,
      sliderMax: 'sliderMax' in defaults ? defaults.sliderMax : undefined,
      radioOptions: 'radioOptions' in defaults ? defaults.radioOptions : undefined,
    }));
  };

  const handleAddRadioOption = () => {
    const newKey = `option_${Date.now()}`;
    const newOption: RadioOption = {
      key: newKey,
      label: 'New Option',
      binaryCode: generateDefaultBinaryCode(newKey),
    };
    setDraft((prev) => ({
      ...prev,
      radioOptions: [...(prev.radioOptions || []), newOption],
    }));
  };

  const handleUpdateRadioOption = (key: string, updates: Partial<RadioOption>) => {
    setDraft((prev) => ({
      ...prev,
      radioOptions: prev.radioOptions?.map((opt) => (opt.key === key ? { ...opt, ...updates } : opt)),
    }));
  };

  const handleDeleteRadioOption = (key: string) => {
    setDraft((prev) => ({
      ...prev,
      radioOptions: prev.radioOptions?.filter((opt) => opt.key !== key),
    }));
  };

  const handleCreate = () => {
    const idValidation = validateId(draft.id);
    const binaryValidation = validateBinaryCode(draft.binaryCode);

    if (idValidation) {
      setIdError(idValidation);
      return;
    }

    if (binaryValidation) {
      setBinaryError(binaryValidation);
      return;
    }

    // Validate radio options if radio type
    if (draft.controlType === 'radio' && draft.radioOptions) {
      for (const option of draft.radioOptions) {
        const optionBinaryError = validateBinaryCode(option.binaryCode);
        if (optionBinaryError) {
          setBinaryError(`Radio option "${option.label}": ${optionBinaryError}`);
          return;
        }
      }
    }

    onCreateControl(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Control</DialogTitle>
          <DialogDescription>Configure the properties for your new control.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-id">ID</Label>
                <Input
                  id="modal-id"
                  value={draft.id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  className={idError ? 'border-destructive' : ''}
                />
                {idError && <p className="text-xs text-destructive">{idError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-label">Label</Label>
                <Input
                  id="modal-label"
                  value={draft.label}
                  onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-type">Control Type</Label>
                <Select value={draft.controlType} onValueChange={handleTypeChange}>
                  <SelectTrigger id="modal-type">
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
            </div>
          </div>

          <Separator />

          {/* Layout Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Layout</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-x">X Position</Label>
                <Input
                  id="modal-x"
                  type="number"
                  value={draft.x}
                  onChange={(e) => setDraft((prev) => ({ ...prev, x: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-y">Y Position</Label>
                <Input
                  id="modal-y"
                  type="number"
                  value={draft.y}
                  onChange={(e) => setDraft((prev) => ({ ...prev, y: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-width">Width</Label>
                <Input
                  id="modal-width"
                  type="number"
                  value={draft.width}
                  onChange={(e) => setDraft((prev) => ({ ...prev, width: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-height">Height</Label>
                <Input
                  id="modal-height"
                  type="number"
                  value={draft.height}
                  onChange={(e) => setDraft((prev) => ({ ...prev, height: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
            <div className="space-y-2">
              <Label htmlFor="modal-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="modal-color"
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-20"
                />
                <Input
                  value={draft.color}
                  onChange={(e) => setDraft((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Signal Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Signal</h3>
            <div className="space-y-2">
              <Label htmlFor="modal-binary">Binary Code</Label>
              <Input
                id="modal-binary"
                value={draft.binaryCode}
                onChange={(e) => handleBinaryCodeChange(e.target.value)}
                className={binaryError ? 'border-destructive' : ''}
                placeholder="e.g., 10101010"
              />
              {binaryError && <p className="text-xs text-destructive">{binaryError}</p>}
            </div>
          </div>

          {/* Type-specific Settings */}
          {draft.controlType === 'slider' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Slider Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-slider-min">Slider Min</Label>
                    <Input
                      id="modal-slider-min"
                      type="number"
                      value={draft.sliderMin ?? 0}
                      onChange={(e) => setDraft((prev) => ({ ...prev, sliderMin: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-slider-max">Slider Max</Label>
                    <Input
                      id="modal-slider-max"
                      type="number"
                      value={draft.sliderMax ?? 100}
                      onChange={(e) => setDraft((prev) => ({ ...prev, sliderMax: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {draft.controlType === 'radio' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Radio Options</h3>
                  <Button size="sm" variant="outline" onClick={handleAddRadioOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-3">
                  {draft.radioOptions?.map((option) => (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!!idError || !!binaryError}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
