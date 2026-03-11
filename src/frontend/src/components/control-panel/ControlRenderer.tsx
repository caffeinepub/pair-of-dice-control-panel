import { useSignalEmitter } from "@/hooks/useSignalEmitter";
import {
  generateButtonGpiosetCommand,
  generateGpiosetCommandSequence,
} from "@/lib/gpiosetCommands";
import { cn } from "@/lib/utils";
import type { ControlConfig } from "@/types/controlPanel";
import { useEffect, useRef, useState } from "react";

interface ControlRendererProps {
  control: ControlConfig;
  isEditMode: boolean;
}

export function ControlRenderer({ control, isEditMode }: ControlRendererProps) {
  const { emit } = useSignalEmitter();
  const [isPressed, setIsPressed] = useState(false);
  const [localToggleState, setLocalToggleState] = useState(
    control.toggleState ?? false,
  );
  const [localSliderValue, setLocalSliderValue] = useState(
    control.sliderValue ?? 50,
  );
  const [localRadioSelected, setLocalRadioSelected] = useState(
    control.radioSelected ?? "",
  );

  const prevSliderValueRef = useRef(control.sliderValue ?? 50);
  const keyPressedRef = useRef(false);
  const buttonResetSentRef = useRef(false);

  useEffect(() => {
    prevSliderValueRef.current = control.sliderValue ?? 50;
  }, [control.sliderValue]);

  // ── Button ──────────────────────────────────────────────────────────────────

  const handleButtonPress = () => {
    if (isEditMode) return;
    const decimalCode = control.decimalCode || 1;
    setIsPressed(true);
    buttonResetSentRef.current = false;
    const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 1);
    emit(
      control.id,
      control.controlType,
      control.label || null,
      "press",
      decimalCode,
      "button",
      gpiosetCommand,
    );
  };

  const handleButtonRelease = () => {
    if (isEditMode) return;
    setIsPressed(false);
    if (buttonResetSentRef.current) return;
    buttonResetSentRef.current = true;
    const decimalCode = control.decimalCode || 1;
    const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 0);
    emit(
      control.id,
      control.controlType,
      control.label || null,
      "release",
      decimalCode,
      "button",
      gpiosetCommand,
    );
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!keyPressedRef.current) {
        keyPressedRef.current = true;
        handleButtonPress();
      }
    }
  };

  const handleButtonKeyUp = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === "Enter" || e.key === " ") {
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

  // ── Toggle ──────────────────────────────────────────────────────────────────

  const handleToggle = () => {
    if (isEditMode) return;
    const newState = !localToggleState;
    const codeType = newState ? "on" : "off";
    const decimalCode = newState
      ? control.decimalCodeOn || 1
      : control.decimalCodeOff || 2;
    setLocalToggleState(newState);
    const stateLabel = newState ? "ON" : "OFF";
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=${newState ? 1 : 0}`;
    emit(
      control.id,
      control.controlType,
      control.label || null,
      stateLabel,
      decimalCode,
      codeType,
      gpiosetCommand,
    );
  };

  // ── Slider ───────────────────────────────────────────────────────────────────

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    const value = Number(e.target.value);
    const previousValue = prevSliderValueRef.current;
    if (value === previousValue) return;
    const codeType = value > previousValue ? "up" : "down";
    const decimalCode =
      value > previousValue
        ? control.decimalCodeUp || 1
        : control.decimalCodeDown || 2;
    setLocalSliderValue(value);
    prevSliderValueRef.current = value;
    const min = control.sliderMin ?? 0;
    const max = control.sliderMax ?? 100;
    const normalizedValue = value >= (min + max) / 2 ? 1 : 0;
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=${normalizedValue}`;
    emit(
      control.id,
      control.controlType,
      control.label || null,
      value.toString(),
      decimalCode,
      codeType,
      gpiosetCommand,
    );
  };

  // ── Radio ────────────────────────────────────────────────────────────────────

  const handleRadioSelect = (optionKey: string) => {
    if (isEditMode) return;
    const option = control.radioOptions?.find((opt) => opt.key === optionKey);
    if (!option) return;
    setLocalRadioSelected(optionKey);
    const decimalCode = option.decimalCode;
    const gpiosetSequence = generateGpiosetCommandSequence(decimalCode);
    emit(
      control.id,
      "radio",
      control.label || null,
      gpiosetSequence,
      decimalCode,
      "radio",
      gpiosetSequence,
    );
  };

  // ── Dial ─────────────────────────────────────────────────────────────────────

  const handleDialStep = (direction: "left" | "right") => {
    if (isEditMode) return;
    const decimalCode =
      direction === "left"
        ? control.decimalCodeLeft || 1
        : control.decimalCodeRight || 2;
    const directionLabel =
      direction === "left" ? "counterclockwise" : "clockwise";
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=1`;
    emit(
      control.id,
      control.controlType,
      control.label || null,
      directionLabel,
      decimalCode,
      direction,
      gpiosetCommand,
    );
  };

  const handleDialWheel = (e: React.WheelEvent) => {
    if (isEditMode) return;
    e.preventDefault();
    if (e.deltaY < 0) handleDialStep("right");
    else if (e.deltaY > 0) handleDialStep("left");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const baseClasses = cn(
    "h-full w-full rounded-xl border-2 transition-all duration-150",
    "flex items-center justify-center text-center font-semibold",
    "select-none",
  );

  if (control.controlType === "button") {
    return (
      <button
        className={cn(
          baseClasses,
          isPressed && !isEditMode
            ? "bg-white text-black border-white"
            : "bg-card border-border text-foreground",
          !isEditMode && "hover:brightness-110 active:scale-95",
        )}
        style={{
          backgroundColor: !isPressed || isEditMode ? control.color : undefined,
        }}
        type="button"
        onPointerDown={handleButtonPress}
        onPointerUp={handleButtonRelease}
        onPointerCancel={handleButtonRelease}
        onPointerLeave={handleButtonRelease}
        onKeyDown={handleButtonKeyDown}
        onKeyUp={handleButtonKeyUp}
        onBlur={handleButtonBlur}
        disabled={isEditMode}
      >
        <span
          className={cn(isPressed && !isEditMode ? "text-black" : "text-white")}
        >
          {control.label}
        </span>
      </button>
    );
  }

  if (control.controlType === "toggle") {
    const isOn = isEditMode ? (control.toggleState ?? false) : localToggleState;
    return (
      <button
        className={cn(
          baseClasses,
          isOn && !isEditMode
            ? "bg-white text-black border-white"
            : "bg-card border-border text-foreground",
          !isEditMode && "hover:brightness-110",
        )}
        style={{
          backgroundColor: !isOn || isEditMode ? control.color : undefined,
        }}
        type="button"
        onClick={handleToggle}
        disabled={isEditMode}
      >
        <span className={cn(isOn && !isEditMode ? "text-black" : "text-white")}>
          {control.label}
          <br />
          <span className="text-sm">{isOn ? "ON" : "OFF"}</span>
        </span>
      </button>
    );
  }

  if (control.controlType === "slider") {
    const value = isEditMode ? (control.sliderValue ?? 50) : localSliderValue;
    const min = control.sliderMin ?? 0;
    const max = control.sliderMax ?? 100;
    const percentage = ((value - min) / (max - min)) * 100;
    const isVertical = control.sliderIsVertical === true;

    if (isVertical) {
      return (
        <div
          className={cn(baseClasses, "flex-col gap-2 p-4")}
          style={{ backgroundColor: control.color, borderColor: control.color }}
        >
          <span className="text-sm text-white">{control.label}</span>
          <div className="flex-1 flex items-center justify-center w-full min-h-0">
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={handleSliderChange}
              disabled={isEditMode}
              style={{
                writingMode:
                  "vertical-lr" as React.CSSProperties["writingMode"],
                direction: "rtl",
                width: "32px",
                height: "100%",
                cursor: "pointer",
                accentColor: "white",
              }}
            />
          </div>
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
      );
    }

    return (
      <div
        className={cn(baseClasses, "flex-col gap-2 p-4")}
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

  if (control.controlType === "radio") {
    const isVertical = control.radioGroupIsVertical !== false;
    const selected = isEditMode
      ? (control.radioSelected ?? "")
      : localRadioSelected;

    return (
      <div
        className={cn(baseClasses, "flex-col gap-2 p-3")}
        style={{ backgroundColor: control.color, borderColor: control.color }}
      >
        <span className="text-xs font-semibold text-white mb-1">
          {control.label}
        </span>
        <div
          className={cn(
            "flex gap-2 w-full",
            isVertical ? "flex-col" : "flex-row",
          )}
        >
          {control.radioOptions?.map((option) => (
            <button
              type="button"
              key={option.key}
              onClick={() => handleRadioSelect(option.key)}
              disabled={isEditMode}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium",
                selected === option.key
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white border-white/30 hover:border-white/60",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (control.controlType === "dial") {
    return (
      <div
        className={cn(baseClasses, "flex-col gap-3 p-4 cursor-pointer")}
        style={{ backgroundColor: control.color, borderColor: control.color }}
        onWheel={handleDialWheel}
      >
        <span className="text-sm text-white">{control.label}</span>
        <div className="flex gap-4 items-center">
          <button
            type="button"
            onClick={() => handleDialStep("left")}
            disabled={isEditMode}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all flex items-center justify-center text-white text-2xl disabled:opacity-50"
          >
            ◀
          </button>
          <div className="w-16 h-16 rounded-full border-4 border-white/40 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <button
            type="button"
            onClick={() => handleDialStep("right")}
            disabled={isEditMode}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all flex items-center justify-center text-white text-2xl disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, "bg-card border-border text-muted-foreground")}
    >
      <span className="text-sm">Unknown: {control.controlType}</span>
    </div>
  );
}
