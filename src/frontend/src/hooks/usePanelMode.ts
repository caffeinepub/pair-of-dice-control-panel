import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/safeBrowser";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type PanelMode = "edit" | "interact";

// Module-level store for shared state
let currentMode: PanelMode = "edit";
const listeners = new Set<() => void>();

function getInitialMode(): PanelMode {
  const stored = safeLocalStorageGet("panelMode", "edit");
  // Migrate old "runtime" value to "interact"
  if (stored === "runtime") {
    return "interact";
  }
  return stored === "edit" || stored === "interact" ? stored : "edit";
}

// Initialize on module load
currentMode = getInitialMode();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentMode;
}

function setGlobalMode(newMode: PanelMode) {
  if (currentMode !== newMode) {
    currentMode = newMode;
    safeLocalStorageSet("panelMode", newMode);
    for (const listener of listeners) listener();
  }
}

export function usePanelMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setMode = useCallback((newMode: PanelMode) => {
    setGlobalMode(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setGlobalMode(currentMode === "edit" ? "interact" : "edit");
  }, []);

  return { mode, setMode, toggleMode };
}
