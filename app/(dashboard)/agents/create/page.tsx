"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

export default function CreateAgentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect back to agents page which will show the creation modal
    router.replace('/agents');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader text="Redirecting..." subtext="Taking you to the agents page" />
    </div>
  );
} 