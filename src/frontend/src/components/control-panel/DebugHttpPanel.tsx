import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { sendGpioSignal } from "@/lib/gpioHttp";
import { Bug, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

interface TestResult {
  timestamp: string;
  success: boolean;
  error?: string;
  decimalCode: number;
  state: "on" | "off";
}

export function DebugHttpPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [buttonNumber, setButtonNumber] = useState<string>("1");
  const [selectedValue, setSelectedValue] = useState<"on" | "off">("on");

  const getValidButtonNumber = (): number => {
    const n = Number.parseInt(buttonNumber, 10);
    if (Number.isNaN(n) || n < 1) return 1;
    if (n > 16) return 16;
    return n;
  };

  const runTest = async (decimalCode: number, state: "on" | "off") => {
    if (isLoading) return;
    setIsLoading(true);
    const timestamp = new Date().toISOString();

    try {
      await sendGpioSignal(decimalCode, state);
      setLastResult({ timestamp, success: true, decimalCode, state });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setLastResult({
        timestamp,
        success: false,
        error: errorMessage,
        decimalCode,
        state,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustom = () => {
    const code = getValidButtonNumber();
    runTest(code, selectedValue);
  };

  const validCode = getValidButtonNumber();
  const previewBody = JSON.stringify({
    button: validCode,
    value: selectedValue,
  });

  return (
    <Card className="border-2 border-warning bg-warning/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">HTTP POST Debug Panel</CardTitle>
        </div>
        <CardDescription>
          Test HTTP POST requests to 7426razpi3.nevadascientific.com/GPIO
          independently
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configure Payload */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Configure Payload:</div>

          <div className="space-y-1">
            <Label htmlFor="button-number" className="text-xs">
              Button Number (1–16)
            </Label>
            <Input
              id="button-number"
              type="number"
              min={1}
              max={16}
              value={buttonNumber}
              onChange={(e) => setButtonNumber(e.target.value)}
              className="h-8 text-sm"
              placeholder="1–16"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Value</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedValue === "on" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedValue("on")}
                disabled={isLoading}
              >
                <span className="mr-1">🟢</span> on
              </Button>
              <Button
                variant={selectedValue === "off" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedValue("off")}
                disabled={isLoading}
              >
                <span className="mr-1">🔴</span> off
              </Button>
            </div>
          </div>
        </div>

        {/* Request Preview */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Request Preview:</div>
          <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1">
            <div>
              URL:{" "}
              <span className="text-primary">
                https://7426razpi3.nevadascientific.com/gpio
              </span>
            </div>
            <div>
              Method: <span className="text-primary">POST</span>
            </div>
            <div>
              Content-Type:{" "}
              <span className="text-primary">application/json</span>
            </div>
            <div>
              Body: <span className="text-primary">{previewBody}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSendCustom}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Send POST Request
        </Button>

        <Separator />

        {/* Quick Test Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Quick Tests:</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => runTest(1, "on")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">🟢</span>
              )}
              ON (btn 1)
            </Button>
            <Button
              onClick={() => runTest(1, "off")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">🔴</span>
              )}
              OFF (btn 1)
            </Button>
            <Button
              onClick={() => runTest(8, "on")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">🟢</span>
              )}
              ON (btn 8)
            </Button>
            <Button
              onClick={() => runTest(16, "off")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">🔴</span>
              )}
              OFF (btn 16)
            </Button>
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Test Result:</div>
              <div
                className={`rounded-lg p-3 space-y-2 ${
                  lastResult.success
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {lastResult.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <Badge
                        variant="outline"
                        className="bg-green-500/20 text-green-700 border-green-500/30"
                      >
                        SUCCESS
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge
                        variant="outline"
                        className="bg-red-500/20 text-red-700 border-red-500/30"
                      >
                        FAILED
                      </Badge>
                    </>
                  )}
                </div>
                <div className="font-mono text-xs space-y-1">
                  <div>
                    Time:{" "}
                    <span className="text-muted-foreground">
                      {new Date(lastResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    Body:{" "}
                    <span className="text-primary">
                      {JSON.stringify({
                        button: lastResult.decimalCode,
                        value: lastResult.state,
                      })}
                    </span>
                  </div>
                  {lastResult.success && (
                    <div className="text-green-600 mt-1">
                      ✓ Request delivered to
                      7426razpi3.nevadascientific.com/gpio
                    </div>
                  )}
                  {lastResult.error && (
                    <div className="text-red-500 mt-2 break-words">
                      Error: {lastResult.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Instructions:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Set button number (1–16) and value (on/off) above</li>
            <li>
              Click <strong>Send POST Request</strong> or use a quick test
              button
            </li>
            <li>
              Your GPIO server at <code>7426razpi3.nevadascientific.com</code>{" "}
              must be running and allow CORS
            </li>
            <li>
              Open browser DevTools (F12) → Network tab to inspect the POST
              request
            </li>
            <li>
              If you see a CORS error, add{" "}
              <code>Access-Control-Allow-Origin: *</code> to your server
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
