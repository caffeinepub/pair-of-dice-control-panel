import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { toast } from 'sonner';

interface FullscreenToggleButtonProps {
  workspaceRef: RefObject<HTMLElement | null>;
}

export function FullscreenToggleButton({ workspaceRef }: FullscreenToggleButtonProps) {
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(workspaceRef);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Fullscreen is not supported in your browser');
      return;
    }

    try {
      await toggleFullscreen();
    } catch (error) {
      toast.error(
        isFullscreen
          ? 'Failed to exit fullscreen mode'
          : 'Failed to enter fullscreen mode'
      );
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleToggle}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      className="gap-2"
    >
      {isFullscreen ? (
        <>
          <Minimize className="h-4 w-4" />
          <span>Exit Fullscreen</span>
        </>
      ) : (
        <>
          <Maximize className="h-4 w-4" />
          <span>Fullscreen</span>
        </>
      )}
    </Button>
  );
}
