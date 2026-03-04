import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { ControlPanelScreen } from "./screens/ControlPanelScreen";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background text-foreground">
        <ControlPanelScreen />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
