"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [authenticated, ready, router]);

  if (!ready || !authenticated) {
    return <div className="full-loader">Checking secure session...</div>;
  }

  return <>{children}</>;
}
