import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useControlLayout } from '@/hooks/useControlLayout';
import type { ControlConfig } from '@/types/controlPanel';
import { cn } from '@/lib/utils';

interface DragControllerProps {
  control: ControlConfig;
  isSelected: boolean;
  onSelect: () => void;
  isDraggable: boolean;
  children: ReactNode;
}

export function DragController({ control, isSelected, onSelect, isDraggable, children }: DragControllerProps) {
  const { updateControl } = useControlLayout();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, controlX: 0, controlY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    
    e.stopPropagation();
    onSelect();

    if (e.button === 0) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        controlX: control.x,
        controlY: control.y,
      };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = Math.max(0, dragStartPos.current.controlX + deltaX);
      const newY = Math.max(0, dragStartPos.current.controlY + deltaY);

      updateControl(control.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, control.id, updateControl]);

  return (
    <div
      className={cn(
        'absolute transition-all',
        isDraggable ? 'cursor-move' : 'cursor-default'
      )}
      style={{
        left: control.x,
        top: control.y,
        width: control.width,
        height: control.height,
        outline: isSelected && isDraggable ? '2px solid hsl(var(--primary))' : 'none',
        outlineOffset: '2px',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}
