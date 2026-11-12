"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getToken, getUser, redirectForRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user?.role) {
      router.replace(redirectForRole());
    }
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
            Pet Shop
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight">
            Gestão do pet shop
          </h1>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            Agenda, tutores, pets, histórico e financeiro em um só lugar — para o
            dono e a equipe.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Entrar
          </Link>
        </div>
      </header>
    </main>
  );
}
