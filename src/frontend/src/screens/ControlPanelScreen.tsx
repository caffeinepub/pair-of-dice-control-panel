import { useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { Workspace } from '@/components/control-panel/Workspace';
import { InspectorPanel } from '@/components/control-panel/InspectorPanel';
import { RecentSignalsPanel } from '@/components/control-panel/RecentSignalsPanel';
import { ImportExportPanel } from '@/components/control-panel/ImportExportPanel';
import { UserExtensionsSection } from '@/components/control-panel/UserExtensionsSection';
import { ModeToggle } from '@/components/control-panel/ModeToggle';
import { FullscreenToggleButton } from '@/components/control-panel/FullscreenToggleButton';
import { CreateControlButton } from '@/components/control-panel/CreateControlButton';
import { ControlLayoutProvider } from '@/components/control-panel/ControlLayoutProvider';
import { usePanelMode } from '@/hooks/usePanelMode';
import { useFullscreen } from '@/hooks/useFullscreen';
import { safeGetHostname } from '@/lib/safeBrowser';
import { SiX } from 'react-icons/si';

export function ControlPanelScreen() {
  const { mode } = usePanelMode();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(workspaceRef);

  return (
    <ControlLayoutProvider>
      <div className="flex h-screen flex-col control-panel-container">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive">
                <SiX className="h-6 w-6 text-destructive-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Pair of Dice Control Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              {mode === 'edit' && <CreateControlButton />}
              {mode === 'interact' && (
                <FullscreenToggleButton 
                  isFullscreen={isFullscreen}
                  isSupported={isSupported}
                  onToggle={toggleFullscreen}
                />
              )}
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Terminal Editor (Edit mode only) */}
          {mode === 'edit' && (
            <aside className="w-80 border-r border-border bg-card overflow-y-auto">
              <InspectorPanel />
            </aside>
          )}

          {/* Center - Workspace */}
          <div 
            ref={workspaceRef}
            className="flex-1 overflow-auto bg-background p-6 control-workspace-region"
            role="region"
            aria-label="Control Panel Workspace"
          >
            <Workspace />
          </div>

          {/* Right Sidebar - Signals & Import/Export & User Extensions */}
          <aside className="w-96 border-l border-border bg-card overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
              <RecentSignalsPanel />
              {mode === 'edit' && (
                <>
                  <Separator />
                  <ImportExportPanel />
                </>
              )}
              <Separator />
              <UserExtensionsSection />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="container flex h-12 items-center justify-center px-4 text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  safeGetHostname()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                caffeine.ai
              </a>
            </span>
          </div>
        </footer>
      </div>
    </ControlLayoutProvider>
  );
}
