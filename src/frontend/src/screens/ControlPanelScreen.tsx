import { ControlLayoutProvider } from "@/components/control-panel/ControlLayoutProvider";
import { CreateControlButton } from "@/components/control-panel/CreateControlButton";
import { DebugHttpPanel } from "@/components/control-panel/DebugHttpPanel";
import { FullscreenToggleButton } from "@/components/control-panel/FullscreenToggleButton";
import { InspectorPanel } from "@/components/control-panel/InspectorPanel";
import { ModeToggle } from "@/components/control-panel/ModeToggle";
import { RecentSignalsPanel } from "@/components/control-panel/RecentSignalsPanel";
import { UserExtensionsSection } from "@/components/control-panel/UserExtensionsSection";
import { Workspace } from "@/components/control-panel/Workspace";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFullscreen } from "@/hooks/useFullscreen";
import { usePanelMode } from "@/hooks/usePanelMode";
import { safeGetHostname } from "@/lib/safeBrowser";
import { Bug, GripHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiX } from "react-icons/si";

export function ControlPanelScreen() {
  const { mode } = usePanelMode();
  const workspaceRef = useRef<HTMLElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } =
    useFullscreen(workspaceRef);
  const [debugOpen, setDebugOpen] = useState(false);

  // Draggable debug panel state
  const [debugPos, setDebugPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    mouseX: number;
    mouseY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const debugRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: debugPos.x,
        posY: debugPos.y,
      };
      setDragging(true);
    },
    [debugPos],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setDebugPos({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  // Reset position when panel is opened
  const handleToggleDebug = () => {
    if (!debugOpen) setDebugPos({ x: 0, y: 0 });
    setDebugOpen((v) => !v);
  };

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
              <h1 className="text-2xl font-bold tracking-tight">
                Pair of Dice Control Panel
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {mode === "edit" && <CreateControlButton />}
              {mode === "interact" && (
                <FullscreenToggleButton
                  isFullscreen={isFullscreen}
                  isSupported={isSupported}
                  onToggle={toggleFullscreen}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleDebug}
                data-ocid="debug.toggle"
                title="Toggle HTTP POST Debug Panel"
                className={debugOpen ? "bg-accent text-accent-foreground" : ""}
              >
                <Bug className="h-5 w-5" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex flex-1 overflow-hidden">
          {/* Left Sidebar - Inspector with Import/Export and User Extensions (Edit mode only) */}
          {mode === "edit" && (
            <aside className="w-80 border-r border-border bg-card overflow-y-auto">
              <div className="flex flex-col p-4 space-y-4">
                <InspectorPanel />
                <Separator />
                <UserExtensionsSection />
              </div>
            </aside>
          )}

          {/* Center - Workspace */}
          <section
            ref={workspaceRef}
            className="flex-1 overflow-hidden bg-background p-4 control-workspace-region"
            aria-label="Control Panel Workspace"
          >
            <Workspace />
          </section>

          {/* Right Sidebar - Signals (Interact mode only) */}
          {mode === "interact" && (
            <aside className="w-80 border-l border-border bg-card overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <RecentSignalsPanel />
              </div>
            </aside>
          )}

          {/* Debug Panel Floating Overlay (Draggable) */}
          {debugOpen && (
            <div
              ref={debugRef}
              className="absolute z-50 w-96 shadow-xl"
              style={{
                top: `calc(0.5rem + ${debugPos.y}px)`,
                right: `calc(1rem - ${debugPos.x}px)`,
                cursor: dragging ? "grabbing" : "default",
                userSelect: dragging ? "none" : undefined,
              }}
            >
              {/* Drag handle */}
              <div
                className="flex items-center justify-center h-6 rounded-t-lg bg-muted border border-b-0 border-border cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                title="Drag to move"
              >
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <DebugHttpPanel />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="container flex h-12 items-center justify-center px-4 text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  safeGetHostname(),
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
