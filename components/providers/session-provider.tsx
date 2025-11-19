"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/lib/stores/auth-store";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check auth once on mount
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  return <>{children}</>;
} 