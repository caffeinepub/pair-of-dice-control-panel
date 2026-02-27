import { usePanelMode } from '@/hooks/usePanelMode';
import { Button } from '@/components/ui/button';
import { Edit, Play } from 'lucide-react';

export function ModeToggle() {
  const { mode, toggleMode } = usePanelMode();

  return (
    <Button
      onClick={toggleMode}
      variant={mode === 'edit' ? 'default' : 'secondary'}
      className="gap-2"
    >
      {mode === 'edit' ? (
        <>
          <Edit className="h-4 w-4" />
          Edit Mode
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          Interact Mode
        </>
      )}
    </Button>
  );
}
