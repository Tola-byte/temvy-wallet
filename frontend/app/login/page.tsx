"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready) {
      router.replace("/");
    }
  }, [ready, router]);

  return <main className="full-loader">Redirecting...</main>;
}
