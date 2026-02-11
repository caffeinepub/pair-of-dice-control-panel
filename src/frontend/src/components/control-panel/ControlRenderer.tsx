import { useState } from 'react';
import type { ControlConfig } from '@/types/controlPanel';
import { useControlLayout } from '@/hooks/useControlLayout';
import { useSignalEmitter } from '@/hooks/useSignalEmitter';
import { cn } from '@/lib/utils';

interface ControlRendererProps {
  control: ControlConfig;
  isEditMode: boolean;
}

export function ControlRenderer({ control, isEditMode }: ControlRendererProps) {
  const { updateControl } = useControlLayout();
  const { emit } = useSignalEmitter();
  const [isPressed, setIsPressed] = useState(false);

  const handleButtonPress = () => {
    if (isEditMode) return;
    setIsPressed(true);
    emit(control.id, control.controlType, control.label, 'pressed', control.binaryCode);
    console.log(`Button pressed: ${control.label} (${control.binaryCode})`);
  };

  const handleButtonRelease = () => {
    if (isEditMode) return;
    setIsPressed(false);
    emit(control.id, control.controlType, control.label, 'released', control.binaryCode);
  };

  const handleToggle = () => {
    if (isEditMode) return;
    const newState = !control.toggleState;
    updateControl(control.id, { toggleState: newState });
    emit(control.id, control.controlType, control.label, newState ? 'on' : 'off', control.binaryCode);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    const value = Number(e.target.value);
    updateControl(control.id, { sliderValue: value });
    emit(control.id, control.controlType, control.label, value.toString(), control.binaryCode);
  };

  const handleRadioSelect = (optionKey: string) => {
    if (isEditMode) return;
    const option = control.radioOptions?.find((opt) => opt.key === optionKey);
    if (!option) return;
    updateControl(control.id, { radioSelected: optionKey });
    emit(control.id, 'radio', control.label, option.label, option.binaryCode);
  };

  const baseClasses = cn(
    'h-full w-full rounded-xl border-2 transition-all duration-150',
    'flex items-center justify-center text-center font-semibold',
    'select-none'
  );

  if (control.controlType === 'button') {
    return (
      <button
        className={cn(
          baseClasses,
          isPressed && !isEditMode ? 'bg-white text-black border-white' : 'bg-card border-border text-foreground',
          !isEditMode && 'hover:brightness-110 active:scale-95'
        )}
        style={{
          backgroundColor: !isPressed || isEditMode ? control.color : undefined,
        }}
        onPointerDown={handleButtonPress}
        onPointerUp={handleButtonRelease}
        onPointerCancel={handleButtonRelease}
        onPointerLeave={handleButtonRelease}
        disabled={isEditMode}
      >
        <span className={cn(isPressed && !isEditMode ? 'text-black' : 'text-white')}>{control.label}</span>
      </button>
    );
  }

  if (control.controlType === 'toggle') {
    const isOn = control.toggleState;
    return (
      <button
        className={cn(
          baseClasses,
          isOn && !isEditMode ? 'bg-white text-black border-white' : 'bg-card border-border text-foreground',
          !isEditMode && 'hover:brightness-110'
        )}
        style={{
          backgroundColor: !isOn || isEditMode ? control.color : undefined,
        }}
        onClick={handleToggle}
        disabled={isEditMode}
      >
        <span className={cn(isOn && !isEditMode ? 'text-black' : 'text-white')}>
          {control.label}
          <br />
          <span className="text-sm">{isOn ? 'ON' : 'OFF'}</span>
        </span>
      </button>
    );
  }

  if (control.controlType === 'slider') {
    const value = control.sliderValue ?? 50;
    const min = control.sliderMin ?? 0;
    const max = control.sliderMax ?? 100;
    const percentage = ((value - min) / (max - min)) * 100;
    const isVertical = control.sliderIsVertical === true;

    if (isVertical) {
      return (
        <div
          className={cn(baseClasses, 'flex-col gap-2 p-4')}
          style={{ backgroundColor: control.color, borderColor: control.color }}
        >
          <span className="text-sm text-white">{control.label}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            disabled={isEditMode}
            className="slider-vertical accent-white"
            style={{
              background: `linear-gradient(to top, white ${percentage}%, rgba(255,255,255,0.3) ${percentage}%)`,
            }}
          />
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
      );
    }

    return (
      <div
        className={cn(baseClasses, 'flex-col gap-2 p-4')}
        style={{ backgroundColor: control.color, borderColor: control.color }}
      >
        <span className="text-sm text-white">{control.label}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleSliderChange}
          disabled={isEditMode}
          className="w-full accent-white"
          style={{
            background: `linear-gradient(to right, white ${percentage}%, rgba(255,255,255,0.3) ${percentage}%)`,
          }}
        />
        <span className="text-lg font-bold text-white">{value}</span>
      </div>
    );
  }

  if (control.controlType === 'radio') {
    const isVertical = control.radioGroupIsVertical !== false;
    
    return (
      <div
        className={cn(baseClasses, 'flex-col gap-2 p-3')}
        style={{ backgroundColor: control.color, borderColor: control.color }}
      >
        <span className="text-xs text-white font-semibold">{control.label}</span>
        <div className={cn(
          'flex gap-2 w-full flex-1',
          isVertical ? 'flex-col' : 'flex-row'
        )}>
          {control.radioOptions?.map((option) => {
            const isSelected = control.radioSelected === option.key;
            return (
              <button
                key={option.key}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-all flex-1',
                  isSelected && !isEditMode
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white border-white/30',
                  !isEditMode && 'hover:border-white/60 hover:bg-white/10'
                )}
                onClick={() => handleRadioSelect(option.key)}
                disabled={isEditMode}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
