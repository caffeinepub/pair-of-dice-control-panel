import { useControlLayout } from "@/hooks/useControlLayout";
import { usePanelMode } from "@/hooks/usePanelMode";
import { useEffect, useRef, useState } from "react";
import { ControlRenderer } from "./ControlRenderer";
import { DragController } from "./DragController";

const CANVAS_W = 1000;
const CANVAS_H = 550;

export function Workspace() {
  const { controls, selectedControlId, setSelectedControlId } =
    useControlLayout();
  const { mode } = usePanelMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Clear selection when switching to interact mode
  useEffect(() => {
    if (mode === "interact" && selectedControlId) {
      setSelectedControlId(null);
    }
  }, [mode, selectedControlId, setSelectedControlId]);

  // Compute scale so the 1000×550 canvas fills available container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      const scaleX = availW / CANVAS_W;
      const scaleY = availH / CANVAS_H;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-start justify-center"
    >
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          position: "relative",
          flexShrink: 0,
        }}
        className="rounded-lg border-2 border-border bg-card shadow-lg"
      >
        {controls.map((control) => (
          <DragController
            key={control.id}
            control={control}
            isSelected={selectedControlId === control.id}
            onSelect={() => mode === "edit" && setSelectedControlId(control.id)}
            isDraggable={mode === "edit"}
          >
            <ControlRenderer control={control} isEditMode={mode === "edit"} />
          </DragController>
        ))}
        {controls.length === 0 && (
          <div
            className="flex h-full items-center justify-center text-muted-foreground"
            data-ocid="workspace.empty_state"
          >
            <p className="text-lg">
              No controls yet. Import a layout to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
