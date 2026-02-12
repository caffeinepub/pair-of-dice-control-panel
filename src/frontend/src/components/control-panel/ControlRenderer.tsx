import { useState, useRef } from 'react';
import type { ControlConfig } from '@/types/controlPanel';
import { useSignalEmitter } from '@/hooks/useSignalEmitter';
import { cn } from '@/lib/utils';

interface ControlRendererProps {
  control: ControlConfig;
  isEditMode: boolean;
}

export function ControlRenderer({ control, isEditMode }: ControlRendererProps) {
  const { emit } = useSignalEmitter();
  const [isPressed, setIsPressed] = useState(false);
  const [localToggleState, setLocalToggleState] = useState(control.toggleState ?? false);
  const [localSliderValue, setLocalSliderValue] = useState(control.sliderValue ?? 50);
  const [localRadioSelected, setLocalRadioSelected] = useState(control.radioSelected ?? '');
  const keyPressedRef = useRef(false);

  const handleButtonPress = () => {
    if (isEditMode) return;
    setIsPressed(true);
    emit(control.id, control.controlType, control.label || null, 'pressed', control.binaryCode);
  };

  const handleButtonRelease = () => {
    if (isEditMode) return;
    setIsPressed(false);
    emit(control.id, control.controlType, control.label || null, 'released', control.binaryCode);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    // Only handle Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Prevent repeat events when key is held down
      if (!keyPressedRef.current) {
        keyPressedRef.current = true;
        handleButtonPress();
      }
    }
  };

  const handleButtonKeyUp = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      keyPressedRef.current = false;
      handleButtonRelease();
    }
  };

  const handleButtonBlur = () => {
    // Reset key state and release button if it was pressed when focus is lost
    if (keyPressedRef.current) {
      keyPressedRef.current = false;
      handleButtonRelease();
    }
  };

  const handleToggle = () => {
    if (isEditMode) return;
    const newState = !localToggleState;
    setLocalToggleState(newState);
    emit(control.id, control.controlType, control.label || null, newState ? 'on' : 'off', control.binaryCode);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    const value = Number(e.target.value);
    setLocalSliderValue(value);
    emit(control.id, control.controlType, control.label || null, value.toString(), control.binaryCode);
  };

  const handleRadioSelect = (optionKey: string) => {
    if (isEditMode) return;
    const option = control.radioOptions?.find((opt) => opt.key === optionKey);
    if (!option) return;
    setLocalRadioSelected(optionKey);
    emit(control.id, 'radio', control.label || null, option.label, option.binaryCode);
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
        onKeyDown={handleButtonKeyDown}
        onKeyUp={handleButtonKeyUp}
        onBlur={handleButtonBlur}
        disabled={isEditMode}
      >
        <span className={cn(isPressed && !isEditMode ? 'text-black' : 'text-white')}>{control.label}</span>
      </button>
    );
  }

  if (control.controlType === 'toggle') {
    const isOn = isEditMode ? (control.toggleState ?? false) : localToggleState;
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
    const value = isEditMode ? (control.sliderValue ?? 50) : localSliderValue;
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
    const selected = isEditMode ? (control.radioSelected ?? '') : localRadioSelected;
    
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
            const isSelected = selected === option.key;
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
