import { useState, useEffect, useCallback, RefObject } from 'react';
import { isFullscreenSupported, isBrowserAvailable } from '@/lib/safeBrowser';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  toggleFullscreen: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

export function useFullscreen(elementRef: RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported] = useState(() => isFullscreenSupported());

  // Sync fullscreen state on mount and when it changes
  useEffect(() => {
    if (!isBrowserAvailable()) return;

    const syncFullscreenState = () => {
      try {
        const fullscreenElement =
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement;

        // Check if the fullscreen element is our target element
        setIsFullscreen(fullscreenElement === elementRef.current);
      } catch (error) {
        // Fullscreen API unavailable
        setIsFullscreen(false);
      }
    };

    // Initialize state immediately
    syncFullscreenState();

    const handleFullscreenChange = () => {
      syncFullscreenState();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [elementRef]);

  const enterFullscreen = useCallback(async () => {
    if (!elementRef.current || !isSupported) {
      throw new Error('Fullscreen is not supported or element is not available');
    }

    const element = elementRef.current;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      throw new Error('Failed to enter fullscreen mode');
    }
  }, [elementRef, isSupported]);

  const exitFullscreen = useCallback(async () => {
    if (!isBrowserAvailable()) {
      throw new Error('Browser APIs are not available');
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      throw new Error('Failed to exit fullscreen mode');
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
