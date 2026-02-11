import { useState, useCallback, useEffect } from 'react';

export type PanelMode = 'edit' | 'runtime';

export function usePanelMode() {
  const [mode, setMode] = useState<PanelMode>(() => {
    const stored = localStorage.getItem('panelMode');
    return (stored as PanelMode) || 'edit';
  });

  useEffect(() => {
    localStorage.setItem('panelMode', mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'edit' ? 'runtime' : 'edit'));
  }, []);

  return { mode, setMode, toggleMode };
}
