import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { AddControlModal } from './AddControlModal';
import { useControlLayout } from '@/hooks/useControlLayout';
import { usePanelMode } from '@/hooks/usePanelMode';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CreateControlButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isInitialized, isLoading } = useControlLayout();
  const { mode } = usePanelMode();

  const isDisabled = !isInitialized || isLoading || mode !== 'edit';

  const getTooltipMessage = () => {
    if (!isInitialized || isLoading) {
      return 'Loading...';
    }
    if (mode !== 'edit') {
      return 'Switch to Edit mode to add controls';
    }
    return 'Add a new control';
  };

  const LoadingIcon = isLoading ? Loader2 : Plus;

  const button = (
    <Button
      variant="default"
      size="default"
      onClick={() => setIsModalOpen(true)}
      disabled={isDisabled}
    >
      <LoadingIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Add Control
    </Button>
  );

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} aria-disabled="true">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      {button}
      <AddControlModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
