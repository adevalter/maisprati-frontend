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

function onlyNumbers(value) {
  return value.replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (digits.length <= 10) {
    if (number.length <= 4) {
      return `(${ddd}) ${number}`;
    }

    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
}

function formatDocument(value) {
  const digits = onlyNumbers(value).slice(0, 14);

  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;

    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) {return digits};
  if (digits.length <= 5) {return `${digits.slice(0, 2)}.${digits.slice(2)}`};
  if (digits.length <= 8) {return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`};
  if (digits.length <= 12) {return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`};

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

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

const LIMITE_CARACTERES = 80

// Formatação do e-mail
function formatEmail(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .slice(0, LIMITE_CARACTERES);
}

// Validação do formato do e-mail
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

  function updateField(field, value) {
    let formattedValue = value

    if(field === "mobile" || field === "phone") {
      formattedValue = formatPhone(value)
    }

    if(field === "document") {
      formattedValue = formatDocument(value)
    }

    if(field === "email") {
      formattedValue = formatEmail(value)
    }

    setForm((prev) => ({ ...prev, [field]: formattedValue }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if(form.email && !validarEmail(form.email)) {
      setError("Informe um endereço de e-mail válido.");
      return;
  }

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
          <Field label="Celular" value={form.mobile} onChange={(v) => updateField("mobile", v)} inputMode="numeric" maxLength={15} />
          <Field label="Telefone" value={form.phone} onChange={(v) => updateField("phone", v)} inputMode="numeric" maxLength={15}/>
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
            inputMode="numeric"
            maxLength={18}
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