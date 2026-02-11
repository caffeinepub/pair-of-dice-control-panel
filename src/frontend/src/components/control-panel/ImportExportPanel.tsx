import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useControlLayout } from '@/hooks/useControlLayout';
import { usePanelMode } from '@/hooks/usePanelMode';
import { exportLayout, importLayout } from '@/lib/layoutSerialization';
import { downloadJSON } from '@/lib/download';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SharedAddControlButton } from './SharedAddControlButton';

export function ImportExportPanel() {
  const { controls, applyImportedLayout } = useControlLayout();
  const { mode } = usePanelMode();
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === 'edit';

  const handleExport = () => {
    if (!isEditMode) return;
    const layout = { controls };
    const json = exportLayout(layout);
    downloadJSON(json, `control-panel-${Date.now()}.json`);
    toast.success('Layout exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const result = importLayout(json);

      if (result.errors) {
        setImportErrors(result.errors.map((err) => `${err.field}: ${err.message}`));
        toast.error('Import failed - see errors below');
      } else if (result.layout) {
        applyImportedLayout(result.layout);
        setImportErrors([]);
        toast.success('Layout imported successfully');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions" disabled={!isEditMode}>Actions</TabsTrigger>
            <TabsTrigger value="versions" disabled={!isEditMode}>Versions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="actions" className="space-y-4 mt-4">
            <Button 
              onClick={handleExport} 
              className="w-full" 
              variant="outline"
              disabled={!isEditMode}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Layout
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
                disabled={!isEditMode}
              />
              <Button 
                asChild={isEditMode} 
                className="w-full" 
                variant="outline"
                disabled={!isEditMode}
              >
                {isEditMode ? (
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Layout
                  </label>
                ) : (
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Layout
                  </span>
                )}
              </Button>
            </div>

            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-xs space-y-1">
                    {importErrors.map((error, idx) => (
                      <div key={idx}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="versions" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Manage control panel versions and configurations.
            </div>
            <SharedAddControlButton variant="outline" className="w-full gap-2" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
