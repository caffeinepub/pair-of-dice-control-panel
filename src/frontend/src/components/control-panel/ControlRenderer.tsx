import { useState, useRef } from 'react';
import type { ControlConfig } from '@/types/controlPanel';
import { useSignalEmitter } from '@/hooks/useSignalEmitter';
import { cn } from '@/lib/utils';
import { generateGpiosetCommandSequence, generateButtonGpiosetCommand } from '@/lib/gpiosetCommands';
import { validateBinaryCode } from '@/lib/binaryCode';
import { deriveButtonIdFromBinaryCode } from '@/lib/buttonCode';
import { sendGpioPost } from '@/lib/gpioHttp';

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
  const toggleResetTimeoutRef = useRef<number | null>(null);
  const dialResetTimeoutRef = useRef<number | null>(null);
  const radioResetTimeoutRef = useRef<number | null>(null);
  const buttonResetSentRef = useRef(false);

  const handleButtonPress = () => {
    if (isEditMode) return;
    
    // Derive button ID from binary code
    const buttonId = deriveButtonIdFromBinaryCode(control.binaryCode);
    if (buttonId === null) {
      console.warn(`Button press ignored: Invalid button code "${control.binaryCode}"`);
      return;
    }
    
    setIsPressed(true);
    buttonResetSentRef.current = false;
    
    // Send HTTP POST with button's binary code
    sendGpioPost(control.binaryCode);
    
    // Generate single gpioset command for button press (state=1)
    const gpiosetCommand = generateButtonGpiosetCommand(buttonId, 1);
    emit(control.id, control.controlType, control.label || null, gpiosetCommand, control.binaryCode);
  };

  const handleButtonRelease = () => {
    if (isEditMode) return;
    setIsPressed(false);
    
    // Derive button ID from binary code
    const buttonId = deriveButtonIdFromBinaryCode(control.binaryCode);
    if (buttonId === null) {
      console.warn(`Button release ignored: Invalid button code "${control.binaryCode}"`);
      return;
    }
    
    // Send reset POST immediately on release (only once per press)
    if (!buttonResetSentRef.current) {
      buttonResetSentRef.current = true;
      sendGpioPost('0000');
      
      // Generate single gpioset command for button release (state=0)
      const gpiosetCommand = generateButtonGpiosetCommand(buttonId, 0);
      emit(control.id, control.controlType, control.label || null, gpiosetCommand, control.binaryCode);
    }
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
    
    // Validate binary code before emitting
    const validationError = validateBinaryCode(control.binaryCode);
    if (validationError) {
      console.warn(`Toggle ignored: ${validationError}`);
      return;
    }
    
    const newState = !localToggleState;
    setLocalToggleState(newState);
    
    // Generate and emit gpioset command sequence for the toggle's binary code
    const gpiosetSequence = generateGpiosetCommandSequence(control.binaryCode);
    emit(control.id, control.controlType, control.label || null, gpiosetSequence, control.binaryCode);
    
    // Clear any existing reset timeout for this toggle
    if (toggleResetTimeoutRef.current !== null) {
      window.clearTimeout(toggleResetTimeoutRef.current);
    }
    
    // Only schedule reset if the emitted code is not already "0000"
    if (control.binaryCode !== '0000') {
      // Schedule a reset emission after 1 second (set all pins to 0)
      toggleResetTimeoutRef.current = window.setTimeout(() => {
        const resetSequence = generateGpiosetCommandSequence('0000');
        emit(control.id, control.controlType, control.label || null, resetSequence, '0000');
        toggleResetTimeoutRef.current = null;
      }, 1000);
    }
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
    
    // Validate binary code before emitting
    const validationError = validateBinaryCode(option.binaryCode);
    if (validationError) {
      console.warn(`Radio selection ignored: ${validationError}`);
      return;
    }
    
    setLocalRadioSelected(optionKey);
    
    // Generate and emit gpioset command sequence for the radio option's binary code
    const gpiosetSequence = generateGpiosetCommandSequence(option.binaryCode);
    emit(control.id, 'radio', control.label || null, gpiosetSequence, option.binaryCode);
    
    // Clear any existing reset timeout for this radio
    if (radioResetTimeoutRef.current !== null) {
      window.clearTimeout(radioResetTimeoutRef.current);
    }
    
    // Only schedule reset if the emitted code is not already "0000"
    if (option.binaryCode !== '0000') {
      // Schedule a reset emission after 1 second (set all pins to 0000)
      radioResetTimeoutRef.current = window.setTimeout(() => {
        const resetSequence = generateGpiosetCommandSequence('0000');
        emit(control.id, 'radio', control.label || null, resetSequence, '0000');
        radioResetTimeoutRef.current = null;
      }, 1000);
    }
  };

  const handleDialStep = (direction: 'increase' | 'decrease') => {
    if (isEditMode) return;

    const binaryCode = direction === 'increase' ? control.dialIncreaseBinaryCode : control.dialDecreaseBinaryCode;
    
    if (!binaryCode) {
      console.warn(`Dial ${direction} code not configured`);
      return;
    }

    const validationError = validateBinaryCode(binaryCode);
    if (validationError) {
      console.warn(`Dial ${direction} ignored: ${validationError}`);
      return;
    }

    // Generate and emit gpioset command sequence for the dial code
    const gpiosetSequence = generateGpiosetCommandSequence(binaryCode);
    emit(control.id, control.controlType, control.label || null, gpiosetSequence, binaryCode);

    // Clear any existing reset timeout for this dial
    if (dialResetTimeoutRef.current !== null) {
      window.clearTimeout(dialResetTimeoutRef.current);
    }

    // Only schedule reset if the emitted code is not already "0000"
    if (binaryCode !== '0000') {
      // Schedule a reset emission after 1 second (set all pins to 0000)
      dialResetTimeoutRef.current = window.setTimeout(() => {
        const resetSequence = generateGpiosetCommandSequence('0000');
        emit(control.id, control.controlType, control.label || null, resetSequence, '0000');
        dialResetTimeoutRef.current = null;
      }, 1000);
    }
  };

  const handleDialWheel = (e: React.WheelEvent) => {
    if (isEditMode) return;
    e.preventDefault();
    
    // deltaY > 0 means scrolling down (decrease), deltaY < 0 means scrolling up (increase)
    if (e.deltaY < 0) {
      handleDialStep('increase');
    } else if (e.deltaY > 0) {
      handleDialStep('decrease');
    }
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

  if (control.controlType === 'dial') {
    return (
      <div
        className={cn(
          baseClasses,
          'flex-col gap-2 p-4 cursor-pointer',
          !isEditMode && 'hover:brightness-110'
        )}
        style={{ backgroundColor: control.color, borderColor: control.color }}
        onWheel={handleDialWheel}
      >
        <span className="text-sm text-white font-semibold">{control.label}</span>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
            <div className="text-2xl text-white">⟲</div>
          </div>
        </div>
        <div className="text-xs text-white/70">Scroll to control</div>
      </div>
    );
  }

  return null;
}
