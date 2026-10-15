"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

const emptyForm = {
  clientId: "",
  name: "",
  species: "CAO",
  breed: "",
  sex: "",
  birthDate: "",
  weightKg: "",
  allergies: "",
  notes: "",
};

function NewPetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    apiRequest("/api/clients", { token })
      .then((data) => {
        setClients(data);
        const fromQuery = searchParams.get("clientId");
        if (fromQuery && data.some((c) => String(c.id) === fromQuery)) {
          setForm((prev) => ({ ...prev, clientId: fromQuery }));
        } else if (data.length === 1) {
          setForm((prev) => ({ ...prev, clientId: String(data[0].id) }));
        }
      })
      .catch((err) => setError(err.message));
  }, [router, searchParams]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        clientId: Number(form.clientId),
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        sex: form.sex || null,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg === "" ? null : Number(form.weightKg),
        allergies: form.allergies || null,
        notes: form.notes || null,
      };
      const created = await apiRequest("/api/pets", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify(body),
      });
      router.push(`/pets/${created.id}`);
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header>
        <Link href="/pets" className="text-sm text-[var(--accent)] hover:underline">
          ← Pets
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Novo pet</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Tutor *</span>
          <select
            required
            value={form.clientId}
            onChange={(e) => updateField("clientId", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
          >
            <option value="" disabled>
              Selecione o tutor
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <Field label="Nome *" value={form.name} onChange={(v) => updateField("name", v)} required />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Espécie *</span>
            <select
              required
              value={form.species}
              onChange={(e) => updateField("species", e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="CAO">Cão</option>
              <option value="GATO">Gato</option>
              <option value="OUTRO">Outro</option>
            </select>
          </label>
          <Field label="Raça" value={form.breed} onChange={(v) => updateField("breed", v)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Sexo</span>
            <select
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="">—</option>
              <option value="MACHO">Macho</option>
              <option value="FEMEA">Fêmea</option>
              <option value="INDEFINIDO">Indefinido</option>
            </select>
          </label>
          <Field
            label="Nascimento"
            type="date"
            value={form.birthDate}
            onChange={(v) => updateField("birthDate", v)}
          />
          <Field
            label="Peso (kg)"
            type="number"
            value={form.weightKg}
            onChange={(v) => updateField("weightKg", v)}
          />
        </div>

        <Field
          label="Alergias"
          value={form.allergies}
          onChange={(v) => updateField("allergies", v)}
          multiline
        />
        <Field
          label="Observações"
          value={form.notes}
          onChange={(v) => updateField("notes", v)}
          multiline
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !form.clientId}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar pet"}
        </button>
      </form>
    </main>
  );
}

export default function NewPetPage() {
  return (
    <Suspense fallback={<main className="p-8 text-[var(--muted)]">Carregando...</main>}>
      <NewPetForm />
    </Suspense>
  );
}

function Field({ label, value, onChange, required, type = "text", multiline }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          min={type === "number" ? "0.01" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
      )}
    </label>
  );
}
