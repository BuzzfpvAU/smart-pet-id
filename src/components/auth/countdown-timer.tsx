"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface CountdownTimerProps {
  onResend: () => Promise<void>;
  initialSeconds?: number;
}

export function CountdownTimer({
  onResend,
  initialSeconds = 60,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = useCallback(async () => {
    setIsLoading(true);
    try {
      await onResend();
      setSeconds(initialSeconds);
    } finally {
      setIsLoading(false);
    }
  }, [onResend, initialSeconds]);

  if (seconds > 0) {
    return (
      <span className="text-sm text-muted-foreground">
        Resend code in {seconds}s
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      onClick={handleResend}
      disabled={isLoading}
      className="p-0 h-auto"
    >
      {isLoading ? "Sending..." : "Resend code"}
    </Button>
  );
}
