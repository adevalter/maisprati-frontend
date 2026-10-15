"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

function speciesLabel(value) {
  return { CAO: "Cão", GATO: "Gato", OUTRO: "Outro" }[value] || value;
}

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPets("");
  }, []);

  async function loadPets(query) {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const path = query ? `/api/pets?q=${encodeURIComponent(query)}` : "/api/pets";
      setPets(await apiRequest(path, { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadPets(q.trim());
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pets</h1>
          <p className="mt-2 text-[var(--muted)]">Animais cadastrados na loja.</p>
        </div>
        <Link
          href="/pets/new"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Novo pet
        </Link>
      </header>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por pet, tutor ou raça"
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
        ) : pets.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">
            Nenhum pet encontrado.{" "}
            <Link href="/pets/new" className="text-[var(--accent)] hover:underline">
              Cadastrar o primeiro
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-[var(--background)]"
                >
                  <div>
                    <p className="font-medium">
                      {pet.name}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {speciesLabel(pet.species)} · Tutor: {pet.clientName}
                      {pet.weightKg != null ? ` · ${pet.weightKg} kg` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--accent)]">Ficha</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
