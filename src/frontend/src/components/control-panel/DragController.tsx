import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useControlLayout } from '@/hooks/useControlLayout';
import type { ControlConfig } from '@/types/controlPanel';

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
      className="absolute cursor-pointer transition-all"
      style={{
        left: `${control.x}px`,
        top: `${control.y}px`,
        width: `${control.width}px`,
        height: `${control.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {isSelected && isDraggable && (
        <div className="absolute inset-0 -m-1 rounded-lg border-2 border-destructive pointer-events-none" />
      )}
      {children}
    </div>
  );
}
