"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getToken, getUser } from "@/lib/auth";

export default function ShopAppLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-[var(--muted)]">
        Carregando...
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}
