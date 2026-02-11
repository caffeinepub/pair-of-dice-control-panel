import { useControlLayout } from '@/hooks/useControlLayout';
import { usePanelMode } from '@/hooks/usePanelMode';
import { ControlRenderer } from './ControlRenderer';
import { DragController } from './DragController';

export function Workspace() {
  const { controls, selectedControlId, setSelectedControlId } = useControlLayout();
  const { mode } = usePanelMode();

  return (
    <div className="relative mx-auto h-[800px] w-full max-w-[1200px] rounded-lg border-2 border-border bg-card shadow-lg">
      {controls.map((control) => (
        <DragController
          key={control.id}
          control={control}
          isSelected={selectedControlId === control.id}
          onSelect={() => mode === 'edit' && setSelectedControlId(control.id)}
          isDraggable={mode === 'edit'}
        >
          <ControlRenderer control={control} isEditMode={mode === 'edit'} />
        </DragController>
      ))}
      {controls.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p className="text-lg">No controls yet. Click "Add Control" to get started.</p>
        </div>
      )}
    </div>
  );
}
