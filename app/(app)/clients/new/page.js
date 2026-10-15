"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

const emptyForm = {
  name: "",
  phone: "",
  mobile: "",
  email: "",
  document: "",
  address: "",
  notes: "",
};

export default function NewClientPage() {
  const router = useRouter();
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
  }, [router]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await apiRequest("/api/clients", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify(form),
      });
      router.push(`/clients/${created.id}`);
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header>
        <Link href="/clients" className="text-sm text-[var(--accent)] hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Novo tutor</h1>
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

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar tutor"}
        </button>
      </form>
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
