"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateAgentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect back to agents page which will show the creation modal
    router.replace('/agents');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the agents page</p>
      </div>
    </div>
  );
} 