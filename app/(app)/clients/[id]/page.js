"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [form, setForm] = useState(null);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    loadClient(token);
  }, [router, id]);

  async function loadClient(token) {
    setLoading(true);
    setError("");
    try {
      const [data, petList] = await Promise.all([
        apiRequest(`/api/clients/${id}`, { token }),
        apiRequest(`/api/pets?clientId=${id}`, { token }),
      ]);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        mobile: data.mobile || "",
        email: data.email || "",
        document: data.document || "",
        address: data.address || "",
        notes: data.notes || "",
      });
      setPets(petList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest(`/api/clients/${id}`, {
        method: "PUT",
        token: getToken(),
        body: JSON.stringify(form),
      });
      setMessage("Tutor atualizado.");
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este tutor?")) return;
    setError("");
    try {
      await apiRequest(`/api/clients/${id}`, {
        method: "DELETE",
        token: getToken(),
      });
      router.push("/clients");
    } catch (err) {
      setError(err.message || "Não foi possível excluir");
    }
  }

  if (loading || !form) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-[var(--muted)]">
        {error || "Carregando..."}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/clients" className="text-sm text-[var(--accent)] hover:underline">
            ← Tutores
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{form.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pets.length} pet(s) vinculado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-[var(--danger)]"
        >
          Excluir
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <Field label="Nome *" value={form.name} onChange={(v) => updateField("name", v)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Celular" value={form.mobile} onChange={(v) => updateField("mobile", v)} />
          <Field label="Telefone" value={form.phone} onChange={(v) => updateField("phone", v)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => updateField("email", v)}
          />
          <Field
            label="CPF/CNPJ"
            value={form.document}
            onChange={(v) => updateField("document", v)}
          />
        </div>
        <Field
          label="Endereço"
          value={form.address}
          onChange={(v) => updateField("address", v)}
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
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Pets</h2>
          <Link
            href={`/pets/new?clientId=${id}`}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Adicionar pet
          </Link>
        </div>
        {pets.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Nenhum pet cadastrado para este tutor.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-[var(--accent)]"
                >
                  <span className="font-medium">
                    {pet.name}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </span>
                  <span className="text-[var(--muted)]">Ficha</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
      )}
    </label>
  );
}
