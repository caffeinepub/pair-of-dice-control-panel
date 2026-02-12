import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';

interface FullscreenToggleButtonProps {
  isFullscreen: boolean;
  isSupported: boolean;
  onToggle: () => Promise<void>;
}

export function FullscreenToggleButton({ isFullscreen, isSupported, onToggle }: FullscreenToggleButtonProps) {
  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Fullscreen is not supported in your browser');
      return;
    }

    try {
      await onToggle();
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
