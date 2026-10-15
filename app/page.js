"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getToken, getUser, redirectForRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    role: "Dono",
    email: "dono@petshop.local",
    password: "dono123",
    note: "equipe, catálogo e contas a pagar",
  },
  {
    role: "Atendente",
    email: "atendente@petshop.local",
    password: "atendente123",
    note: "agenda, tutores, pets e contas a receber",
  },
];

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

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h2 className="text-xl font-semibold">Contas de demonstração</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Mesmas contas seed do backend (`application.yml`).
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {DEMO_ACCOUNTS.map((account) => (
            <li
              key={account.email}
              className="rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <p className="font-medium text-[var(--foreground)]">{account.role}</p>
              <p className="mt-1 text-[var(--muted)]">
                {account.email} / {account.password}
              </p>
              <p className="mt-1 text-[var(--muted)]">{account.note}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Ir para o login
        </Link>
      </section>
    </main>
  );
}
