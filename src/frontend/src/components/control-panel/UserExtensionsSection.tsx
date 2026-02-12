import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code2 } from 'lucide-react';

export function UserExtensionsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Custom Extensions
        </CardTitle>
        <CardDescription>
          Add your custom functionality below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ===================== BEGIN USER CODE ===================== */}
        {/* 
          TODO: Add your custom React components, hooks, and UI here.
          
          You have access to:
          - All shadcn/ui components (Button, Input, Select, etc.)
          - useControlLayout() hook for accessing control state
          - useActor() hook for backend calls
          - All Lucide React icons
          
          Example:
          <div className="space-y-2">
            <Label>My Custom Feature</Label>
            <Button onClick={() => console.log('Custom action')}>
              Click Me
            </Button>
          </div>
        */}
        
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Your custom code goes here
          </p>
        </div>
        
        {/* ====================== END USER CODE ====================== */}
      </CardContent>
    </Card>
  );
}
