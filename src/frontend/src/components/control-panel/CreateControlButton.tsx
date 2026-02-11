import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useControlLayout } from '@/hooks/useControlLayout';
import { Plus } from 'lucide-react';
import { AddControlModal, type ControlDraft } from './AddControlModal';

export function CreateControlButton() {
  const { createControlWithConfig, validateId, isInitialized } = useControlLayout();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateControl = (config: ControlDraft): boolean => {
    const success = createControlWithConfig(config);
    return success;
  };

  return (
    <>
      <Button onClick={() => setModalOpen(true)} variant="destructive" disabled={!isInitialized}>
        <Plus className="h-4 w-4 mr-2" />
        Add Control
      </Button>
      <AddControlModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateControl={handleCreateControl}
        validateId={validateId}
      />
    </>
  );
}
