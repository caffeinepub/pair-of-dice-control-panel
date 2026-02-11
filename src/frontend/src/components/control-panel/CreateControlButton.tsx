import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useControlLayout } from '@/hooks/useControlLayout';
import { usePanelMode } from '@/hooks/usePanelMode';
import { Plus, Loader2 } from 'lucide-react';
import { AddControlModal } from './AddControlModal';

export function CreateControlButton() {
  const { isInitialized, isLoading } = useControlLayout();
  const { mode } = usePanelMode();
  const [modalOpen, setModalOpen] = useState(false);

  // Compute whether we can add a control: must be initialized AND in edit mode
  const canAddControl = isInitialized && mode === 'edit';
  
  // Determine the disabled reason for tooltip
  const getDisabledReason = (): string | null => {
    if (mode !== 'edit') {
      return 'Switch to Edit mode to add controls';
    }
    if (isLoading) {
      return 'Loading layout...';
    }
    if (!isInitialized) {
      return 'Initializing control panel...';
    }
    return null;
  };

  const disabledReason = getDisabledReason();

  // Auto-close modal if guard becomes false while open
  useEffect(() => {
    if (modalOpen && !canAddControl) {
      setModalOpen(false);
    }
  }, [modalOpen, canAddControl]);

  const handleClick = () => {
    if (canAddControl) {
      setModalOpen(true);
    }
  };

  const buttonContent = (
    <Button 
      onClick={handleClick} 
      variant={canAddControl ? 'default' : 'outline'} 
      disabled={!canAddControl}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Add Control
    </Button>
  );

  return (
    <>
      {disabledReason ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        buttonContent
      )}
      <AddControlModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
