import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useControlLayout } from '@/hooks/useControlLayout';
import { exportLayout, importLayout } from '@/lib/layoutSerialization';
import { downloadJSON } from '@/lib/download';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ImportExportPanel() {
  const { controls, applyImportedLayout } = useControlLayout();
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const layout = { controls };
    const json = exportLayout(layout);
    downloadJSON(json, `control-panel-${Date.now()}.json`);
    toast.success('Layout exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <Button onClick={handleExport} className="w-full" variant="outline">
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
          />
          <Button asChild className="w-full" variant="outline">
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import Layout
            </label>
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
      </CardContent>
    </Card>
  );
}
