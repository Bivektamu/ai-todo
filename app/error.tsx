"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-16 px-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-muted">
          Could not load your todos. Please try again.
        </p>
        <Button onClick={() => reset()} variant="primary">
          Try again
        </Button>
      </main>
    </div>
  );
}
