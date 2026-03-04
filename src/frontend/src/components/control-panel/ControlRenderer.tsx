import { useSignalEmitter } from "@/hooks/useSignalEmitter";
import { sendGpioSignal } from "@/lib/gpioHttp";
import {
  generateButtonGpiosetCommand,
  generateGpiosetCommandSequence,
} from "@/lib/gpiosetCommands";
import { cn } from "@/lib/utils";
import type { ControlConfig } from "@/types/controlPanel";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

  // Track previous values for detecting direction changes
  const prevToggleStateRef = useRef(control.toggleState ?? false);
  const prevSliderValueRef = useRef(control.sliderValue ?? 50);
  const prevRadioSelectedRef = useRef(control.radioSelected ?? "");

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
    prevRadioSelectedRef.current = control.radioSelected ?? "";
  }, [control.radioSelected]);

  /**
   * Helper: send GPIO HTTP signal and surface any error as a toast warning.
   * Does NOT throw — failures are non-blocking so the backend event still logs.
   */
  const sendGpioWithFeedback = (decimalCode: number, state: "on" | "off") => {
    sendGpioSignal(decimalCode, state).catch((error) => {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn("[ControlRenderer] GPIO HTTP signal failed:", reason);
      toast.warning(`GPIO HTTP signal failed: ${reason}`, {
        description:
          "The event was logged to the backend, but the GPIO server at 7426razpi3.nevadascientific.com did not receive the signal.",
        duration: 6000,
      });
    });
  };

  const handleButtonPress = () => {
    console.log("[ControlRenderer] ========== BUTTON PRESS EVENT ==========");
    console.log("[ControlRenderer] handleButtonPress called:", {
      controlId: control.id,
      controlType: control.controlType,
      controlLabel: control.label,
      isEditMode,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring press - in edit mode");
      return;
    }

    const decimalCode = control.decimalCode || 1;

    console.log("[ControlRenderer] Button press parameters:", {
      controlId: control.id,
      controlType: control.controlType,
      decimalCode,
      state: "on",
    });

    setIsPressed(true);
    buttonResetSentRef.current = false;

    // Send HTTP POST with decimal code and "on" state — shows toast on failure
    console.log("[ControlRenderer] About to call sendGpioSignal with:", {
      decimalCode,
      state: "on",
    });
    sendGpioWithFeedback(decimalCode, "on");

    // Generate single gpioset command for button press (state=1)
    const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 1);

    console.log("[ControlRenderer] Generated gpioset command:", gpiosetCommand);

    // Emit button press event to backend with command string
    console.log("[ControlRenderer] About to call emit() with:", {
      controlId: control.id,
      controlType: control.controlType,
      label: control.label || null,
      value: "press",
      decimalCode,
      codeType: "button",
      commandStr: gpiosetCommand,
    });

    emit(
      control.id,
      control.controlType,
      control.label || null,
      "press",
      decimalCode,
      "button",
      gpiosetCommand,
    );

    console.log("[ControlRenderer] ✓ emit() called for button press");
  };

  const handleButtonRelease = () => {
    console.log("[ControlRenderer] ========== BUTTON RELEASE EVENT ==========");
    console.log("[ControlRenderer] handleButtonRelease called:", {
      controlId: control.id,
      controlType: control.controlType,
      controlLabel: control.label,
      isEditMode,
      alreadySent: buttonResetSentRef.current,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring release - in edit mode");
      return;
    }

    setIsPressed(false);

    const decimalCode = control.decimalCode || 1;

    console.log("[ControlRenderer] Button release parameters:", {
      controlId: control.id,
      controlType: control.controlType,
      decimalCode,
      state: "off",
      alreadySent: buttonResetSentRef.current,
    });

    // Send HTTP POST with decimal code and "off" state (only once per press)
    if (!buttonResetSentRef.current) {
      buttonResetSentRef.current = true;

      // Send HTTP POST — shows toast on failure
      console.log("[ControlRenderer] About to call sendGpioSignal with:", {
        decimalCode,
        state: "off",
      });
      sendGpioWithFeedback(decimalCode, "off");

      // Generate single gpioset command for button release (state=0)
      const gpiosetCommand = generateButtonGpiosetCommand(decimalCode, 0);

      console.log(
        "[ControlRenderer] Generated gpioset command:",
        gpiosetCommand,
      );

      // Emit button release event to backend with command string
      console.log("[ControlRenderer] About to call emit() with:", {
        controlId: control.id,
        controlType: control.controlType,
        label: control.label || null,
        value: "release",
        decimalCode,
        codeType: "button",
        commandStr: gpiosetCommand,
      });

      emit(
        control.id,
        control.controlType,
        control.label || null,
        "release",
        decimalCode,
        "button",
        gpiosetCommand,
      );

      console.log("[ControlRenderer] ✓ emit() called for button release");
    } else {
      console.log("[ControlRenderer] Skipping release - already sent");
    }
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!keyPressedRef.current) {
        keyPressedRef.current = true;
        console.log("[ControlRenderer] Keyboard press detected:", e.key);
        handleButtonPress();
      }
    }
  };

  const handleButtonKeyUp = (e: React.KeyboardEvent) => {
    if (isEditMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      keyPressedRef.current = false;
      console.log("[ControlRenderer] Keyboard release detected:", e.key);
      handleButtonRelease();
    }
  };

  const handleButtonBlur = () => {
    if (keyPressedRef.current) {
      keyPressedRef.current = false;
      console.log("[ControlRenderer] Button blur - triggering release");
      handleButtonRelease();
    }
  };

  const handleToggle = () => {
    console.log("[ControlRenderer] ========== TOGGLE EVENT ==========");
    console.log("[ControlRenderer] handleToggle called:", {
      controlId: control.id,
      controlType: control.controlType,
      isEditMode,
      currentState: localToggleState,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring toggle - in edit mode");
      return;
    }

    const newState = !localToggleState;
    const codeType = newState ? "on" : "off";
    const decimalCode = newState
      ? control.decimalCodeOn || 1
      : control.decimalCodeOff || 2;

    setLocalToggleState(newState);
    prevToggleStateRef.current = newState;

    const stateLabel = newState ? "ON" : "OFF";
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=${newState ? 1 : 0}`;

    console.log("[ControlRenderer] Toggle parameters:", {
      newState,
      codeType,
      decimalCode,
      stateLabel,
      gpiosetCommand,
    });

    console.log("[ControlRenderer] About to call emit() for toggle");
    emit(
      control.id,
      control.controlType,
      control.label || null,
      stateLabel,
      decimalCode,
      codeType,
      gpiosetCommand,
    );
    console.log("[ControlRenderer] ✓ emit() called for toggle");
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[ControlRenderer] ========== SLIDER CHANGE EVENT ==========");
    console.log("[ControlRenderer] handleSliderChange called:", {
      controlId: control.id,
      controlType: control.controlType,
      isEditMode,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring slider change - in edit mode");
      return;
    }

    const value = Number(e.target.value);
    const previousValue = prevSliderValueRef.current;

    console.log("[ControlRenderer] Slider values:", { value, previousValue });

    if (value === previousValue) {
      console.log("[ControlRenderer] Ignoring slider change - value unchanged");
      return;
    }

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

    console.log("[ControlRenderer] Slider parameters:", {
      codeType,
      decimalCode,
      normalizedValue,
      gpiosetCommand,
    });

    console.log("[ControlRenderer] About to call emit() for slider");
    emit(
      control.id,
      control.controlType,
      control.label || null,
      value.toString(),
      decimalCode,
      codeType,
      gpiosetCommand,
    );
    console.log("[ControlRenderer] ✓ emit() called for slider");
  };

  const handleRadioSelect = (optionKey: string) => {
    console.log("[ControlRenderer] ========== RADIO SELECT EVENT ==========");
    console.log("[ControlRenderer] handleRadioSelect called:", {
      controlId: control.id,
      controlType: control.controlType,
      optionKey,
      isEditMode,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring radio select - in edit mode");
      return;
    }

    const option = control.radioOptions?.find((opt) => opt.key === optionKey);
    if (!option) {
      console.warn("[ControlRenderer] Option not found:", optionKey);
      return;
    }

    setLocalRadioSelected(optionKey);
    prevRadioSelectedRef.current = optionKey;

    // Emit the decimal code from the selected option
    const decimalCode = option.decimalCode;
    const gpiosetSequence = generateGpiosetCommandSequence(decimalCode);

    console.log("[ControlRenderer] Radio parameters:", {
      optionKey,
      decimalCode,
      gpiosetSequence,
    });

    console.log("[ControlRenderer] About to call emit() for radio");
    emit(
      control.id,
      "radio",
      control.label || null,
      gpiosetSequence,
      decimalCode,
      "radio",
      gpiosetSequence,
    );
    console.log("[ControlRenderer] ✓ emit() called for radio");
  };

  const handleDialStep = (direction: "left" | "right") => {
    console.log("[ControlRenderer] ========== DIAL STEP EVENT ==========");
    console.log("[ControlRenderer] handleDialStep called:", {
      controlId: control.id,
      controlType: control.controlType,
      direction,
      isEditMode,
      timestamp: new Date().toISOString(),
    });

    if (isEditMode) {
      console.log("[ControlRenderer] Ignoring dial step - in edit mode");
      return;
    }

    const codeType = direction;
    const decimalCode =
      direction === "left"
        ? control.decimalCodeLeft || 1
        : control.decimalCodeRight || 2;

    const directionLabel =
      direction === "left" ? "counterclockwise" : "clockwise";
    const gpiosetCommand = `gpioset -c gpiochip0 ${control.id}=1`;

    console.log("[ControlRenderer] Dial parameters:", {
      direction,
      codeType,
      decimalCode,
      directionLabel,
      gpiosetCommand,
    });

    console.log("[ControlRenderer] About to call emit() for dial");
    emit(
      control.id,
      control.controlType,
      control.label || null,
      directionLabel,
      decimalCode,
      codeType,
      gpiosetCommand,
    );
    console.log("[ControlRenderer] ✓ emit() called for dial");
  };

  const handleDialWheel = (e: React.WheelEvent) => {
    if (isEditMode) return;
    e.preventDefault();

    console.log("[ControlRenderer] Dial wheel event:", { deltaY: e.deltaY });

    if (e.deltaY < 0) {
      handleDialStep("right");
    } else if (e.deltaY > 0) {
      handleDialStep("left");
    }
  };

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

  // Fallback for unknown control types
  return (
    <div
      className={cn(baseClasses, "bg-card border-border text-muted-foreground")}
    >
      <span className="text-sm">Unknown: {control.controlType}</span>
    </div>
  );
}
