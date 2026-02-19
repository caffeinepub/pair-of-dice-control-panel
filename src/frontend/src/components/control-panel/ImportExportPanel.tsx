import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useControlLayout } from '@/hooks/useControlLayout';
import { exportLayout, importLayout, type ValidationError } from '@/lib/layoutSerialization';
import { downloadJSON } from '@/lib/download';
import { Download, Upload } from 'lucide-react';
import { usePanelMode } from '@/hooks/usePanelMode';

export function ImportExportPanel() {
  const { controls, applyImportedLayout } = useControlLayout();
  const { mode } = usePanelMode();
  const [importJson, setImportJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const isDisabled = mode === 'interact';

  const handleExport = () => {
    const layout = { controls };
    const json = exportLayout(layout);
    downloadJSON(json, 'control-layout.json');
  };

  const handleImport = () => {
    const result = importLayout(importJson);
    
    if (result.errors && result.errors.length > 0) {
      setValidationErrors(result.errors);
      return;
    }
    
    if (result.layout) {
      applyImportedLayout(result.layout);
      setImportJson('');
      setValidationErrors([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={handleExport} className="w-full" disabled={isDisabled}>
            <Download className="mr-2 h-4 w-4" />
            Export Layout
          </Button>
        </div>
        
        <div className="space-y-2">
          <Textarea
            placeholder="Paste JSON layout here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={6}
            disabled={isDisabled}
          />
          {validationErrors.length > 0 && (
            <div className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, idx) => (
                <div key={idx}>
                  <strong>{error.field}:</strong> {error.message}
                </div>
              ))}
            </div>
          )}
          <Button onClick={handleImport} className="w-full" disabled={isDisabled || !importJson}>
            <Upload className="mr-2 h-4 w-4" />
            Import Layout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
