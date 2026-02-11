import { useState, useCallback, useEffect } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/lib/safeBrowser';

export type PanelMode = 'edit' | 'runtime';

export function usePanelMode() {
  const [mode, setMode] = useState<PanelMode>(() => {
    const stored = safeLocalStorageGet('panelMode', 'edit');
    return (stored === 'edit' || stored === 'runtime') ? stored : 'edit';
  });

  useEffect(() => {
    safeLocalStorageSet('panelMode', mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'edit' ? 'runtime' : 'edit'));
  }, []);

  return { mode, setMode, toggleMode };
}
