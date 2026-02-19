import { useState, useRef, useEffect } from 'react';
import type { ControlConfig } from '@/types/controlPanel';
import { useSignalEmitter } from '@/hooks/useSignalEmitter';
import { cn } from '@/lib/utils';
import { generateGpiosetCommandSequence, generateButtonGpiosetCommand } from '@/lib/gpiosetCommands';
import { sendGpioSignal } from '@/lib/gpioHttp';

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
  
  // Track previous values for detecting direction changes
  const prevToggleStateRef = useRef(control.toggleState ?? false);
  const prevSliderValueRef = useRef(control.sliderValue ?? 50);
  const prevRadioSelectedRef = useRef(control.radioSelected ?? '');
  
  const keyPressedRef = useRef(false);
  const buttonResetSentRef = useRef(false);

  // Sync previous toggle state with control prop
  useEffect(() => {
    prevToggleStateRef.current = control.toggleState ?? false;
  }, [control.toggleState]);

  // Sync previous slider value with control prop
  useEffect(() => {
    prevSliderValueRef.current = control.sliderValue ?? 50;
  }, [control.sliderValue]);

  // Sync previous radio selection with control prop
  useEffect(() => {
    prevRadioSelectedRef.current = control.radioSelected ?? '';
  }, [control.radioSelected]);

  const handleButtonPress = () => {
    if (isEditMode) return;
    
    const decimalCode = control.decimalCode || 1;
    
    setIsPressed(true);
    buttonResetSentRef.current = false;
    
    // Send HTTP POST with decimal code and "on" state
    sendGpioSignal(decimalCode, 'on');
    
    // Generate single gpioset command for button press (state=1)
    const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 1);
    
    // Log control interaction
    console.log('[Control Press]', {
      id: control.id,
      signal: 'button',
      command: gpiosetCommand,
      decimalCode
    });
    
    // Emit button press event to backend with command string
    emit(control.id, control.controlType, control.label || null, 'press', decimalCode, 'button', gpiosetCommand);
  };

  const handleButtonRelease = () => {
    if (isEditMode) return;
    setIsPressed(false);
    
    const decimalCode = control.decimalCode || 1;
    
    // Send HTTP POST with decimal code and "off" state (only once per press)
    if (!buttonResetSentRef.current) {
      buttonResetSentRef.current = true;
      sendGpioSignal(decimalCode, 'off');
      
      // Generate single gpioset command for button release (state=0)
      const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 0);
      
      // Log control interaction
      console.log('[Control Release]', {
        id: control.id,
        signal: 'button',
        command: gpiosetCommand,
        decimalCode
      });
      
      // Emit button release event to backend with command string
      emit(control.id, control.controlType, control.label || null, 'release', decimalCode, 'button', gpiosetCommand);
    }
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
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
    if (keyPressedRef.current) {
      keyPressedRef.current = false;
      handleButtonRelease();
    }
  };

  const handleToggle = () => {
    if (isEditMode) return;
    
    const newState = !localToggleState;
    const codeType = newState ? 'on' : 'off';
    const decimalCode = newState ? (control.decimalCodeOn || 1) : (control.decimalCodeOff || 2);
    
    setLocalToggleState(newState);
    prevToggleStateRef.current = newState;
    
    const stateLabel = newState ? 'ON' : 'OFF';
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=${newState ? 1 : 0}`;
    
    // Log control interaction
    console.log('[Control Toggle]', {
      id: control.id,
      signal: 'toggle',
      command: gpiosetCommand
    });
    
    emit(control.id, control.controlType, control.label || null, stateLabel, decimalCode, codeType, gpiosetCommand);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    
    const value = Number(e.target.value);
    const previousValue = prevSliderValueRef.current;
    
    if (value === previousValue) return;
    
    const codeType = value > previousValue ? 'up' : 'down';
    const decimalCode = value > previousValue ? (control.decimalCodeUp || 1) : (control.decimalCodeDown || 2);
    
    setLocalSliderValue(value);
    prevSliderValueRef.current = value;
    
    const min = control.sliderMin ?? 0;
    const max = control.sliderMax ?? 100;
    const normalizedValue = value >= (min + max) / 2 ? 1 : 0;
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=${normalizedValue}`;
    
    // Log control interaction
    console.log('[Control Slider]', {
      id: control.id,
      signal: 'directional',
      command: gpiosetCommand
    });
    
    emit(control.id, control.controlType, control.label || null, value.toString(), decimalCode, codeType, gpiosetCommand);
  };

  const handleRadioSelect = (optionKey: string) => {
    if (isEditMode) return;
    const option = control.radioOptions?.find((opt) => opt.key === optionKey);
    if (!option) return;
    
    setLocalRadioSelected(optionKey);
    prevRadioSelectedRef.current = optionKey;
    
    // Emit the decimal code from the selected option
    const decimalCode = option.decimalCode;
    const gpiosetSequence = generateGpiosetCommandSequence(decimalCode);
    
    // Log control interaction
    console.log('[Control Radio]', {
      id: control.id,
      signal: 'directional',
      command: gpiosetSequence
    });
    
    emit(control.id, 'radio', control.label || null, gpiosetSequence, decimalCode, 'radio', gpiosetSequence);
  };

  const handleDialStep = (direction: 'left' | 'right') => {
    if (isEditMode) return;

    const codeType = direction;
    const decimalCode = direction === 'left' ? (control.decimalCodeLeft || 1) : (control.decimalCodeRight || 2);
    
    const directionLabel = direction === 'left' ? 'counterclockwise' : 'clockwise';
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=1`;
    
    // Log control interaction
    console.log('[Control Dial]', {
      id: control.id,
      signal: 'directional',
      command: gpiosetCommand
    });
    
    emit(control.id, control.controlType, control.label || null, directionLabel, decimalCode, codeType, gpiosetCommand);
  };

  const handleDialWheel = (e: React.WheelEvent) => {
    if (isEditMode) return;
    e.preventDefault();
    
    if (e.deltaY < 0) {
      handleDialStep('right');
    } else if (e.deltaY > 0) {
      handleDialStep('left');
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
        <span className="text-xs font-semibold text-white mb-1">{control.label}</span>
        <div className={cn('flex gap-2 w-full', isVertical ? 'flex-col' : 'flex-row')}>
          {control.radioOptions?.map((option) => (
            <button
              key={option.key}
              onClick={() => handleRadioSelect(option.key)}
              disabled={isEditMode}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                selected === option.key && !isEditMode
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/30',
                !isEditMode && 'hover:border-white/60'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (control.controlType === 'dial') {
    return (
      <div
        className={cn(baseClasses, 'flex-col gap-2 p-4 cursor-pointer')}
        style={{ backgroundColor: control.color, borderColor: control.color }}
        onWheel={handleDialWheel}
      >
        <span className="text-sm text-white">{control.label}</span>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => handleDialStep('left')}
            disabled={isEditMode}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              'bg-transparent text-white border-white/30',
              !isEditMode && 'hover:border-white hover:bg-white/10'
            )}
          >
            ←
          </button>
          <button
            onClick={() => handleDialStep('right')}
            disabled={isEditMode}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              'bg-transparent text-white border-white/30',
              !isEditMode && 'hover:border-white hover:bg-white/10'
            )}
          >
            →
          </button>
        </div>
        <span className="text-xs text-white/70">Scroll or click</span>
      </div>
    );
  }

  return null;
}
