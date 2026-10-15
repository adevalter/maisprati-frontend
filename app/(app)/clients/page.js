"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients("");
  }, []);

  async function loadClients(query) {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const path = query ? `/api/clients?q=${encodeURIComponent(query)}` : "/api/clients";
      setClients(await apiRequest(path, { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadClients(q.trim());
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tutores</h1>
          <p className="mt-2 text-[var(--muted)]">Clientes cadastrados nesta loja.</p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Novo tutor
        </Link>
      </header>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone, e-mail ou documento"
          className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Carregando...</p>
        ) : clients.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">
            Nenhum tutor encontrado.{" "}
            <Link href="/clients/new" className="text-[var(--accent)] hover:underline">
              Cadastrar o primeiro
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-[var(--background)]"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {[client.mobile || client.phone, client.email, client.document]
                        .filter(Boolean)
                        .join(" · ") || "Sem contato"}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--accent)]">Abrir</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
