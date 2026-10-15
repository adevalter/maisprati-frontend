"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

function speciesLabel(value) {
  return { CAO: "Cão", GATO: "Gato", OUTRO: "Outro" }[value] || value;
}

export default function PetHubPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [pet, setPet] = useState(null);
  const [clients, setClients] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(null);
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
    load(token);
  }, [router, id]);

  async function load(token) {
    setLoading(true);
    setError("");
    try {
      const [data, clientList, historyList] = await Promise.all([
        apiRequest(`/api/pets/${id}`, { token }),
        apiRequest("/api/clients", { token }),
        apiRequest(`/api/pets/${id}/history`, { token }),
      ]);
      setPet(data);
      setClients(clientList);
      setHistory(historyList);
      setForm({
        clientId: String(data.clientId),
        name: data.name || "",
        species: data.species || "CAO",
        breed: data.breed || "",
        sex: data.sex || "",
        birthDate: data.birthDate || "",
        weightKg: data.weightKg != null ? String(data.weightKg) : "",
        allergies: data.allergies || "",
        notes: data.notes || "",
      });
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
      const updated = await apiRequest(`/api/pets/${id}`, {
        method: "PUT",
        token: getToken(),
        body: JSON.stringify(body),
      });
      setPet(updated);
      setMessage("Ficha atualizada.");
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este pet?")) return;
    try {
      await apiRequest(`/api/pets/${id}`, { method: "DELETE", token: getToken() });
      router.push("/pets");
    } catch (err) {
      setError(err.message || "Não foi possível excluir");
    }
  }

  if (loading || !form || !pet) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-[var(--muted)]">
        {error || "Carregando..."}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/pets" className="text-sm text-[var(--accent)] hover:underline">
            ← Pets
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {pet.name}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            {speciesLabel(pet.species)} · Tutor:{" "}
            <Link href={`/clients/${pet.clientId}`} className="text-[var(--accent)] hover:underline">
              {pet.clientName}
            </Link>
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

      <section className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:grid-cols-3">
        <SummaryItem label="Peso atual" value={pet.weightKg != null ? `${pet.weightKg} kg` : "—"} />
        <SummaryItem label="Sexo" value={pet.sex || "—"} />
        <SummaryItem label="Nascimento" value={pet.birthDate || "—"} />
        <SummaryItem
          label="Último banho"
          value={lastOfType(history, "BANHO") || "—"}
        />
        <SummaryItem
          label="Última vacina"
          value={lastOfType(history, "VACINA") || "—"}
        />
        <SummaryItem
          label="Próxima dose/retorno"
          value={nextDueFromHistory(history) || "—"}
        />
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <h2 className="text-lg font-semibold">Dados do pet</h2>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Tutor *</span>
          <select
            required
            value={form.clientId}
            onChange={(e) => updateField("clientId", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
          >
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
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar ficha"}
        </button>
      </form>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Carteira de vacinação</h2>
          <Link
            href="/appointments/new"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Agendar vacina
          </Link>
        </div>
        {vaccineHistory(history).length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Nenhuma vacina registrada ainda. Finalize um atendimento de vacinação para
            preencher a carteira.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {vaccineHistory(history).map((h) => (
              <li key={h.id} className="grid gap-1 py-3 text-sm sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <p className="font-medium">
                    {h.vaccineProductName || h.title}
                  </p>
                  <p className="text-[var(--muted)]">
                    {formatDose(h.doseNumber)}
                    {h.professionalName ? ` · ${h.professionalName}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Aplicada</p>
                  <p className="font-medium">
                    {new Date(h.occurredAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Próxima</p>
                  <p className="font-medium text-[var(--accent)]">
                    {h.nextDueAt ? formatDateBr(h.nextDueAt) : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <Link
            href={`/appointments/new`}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Agendar
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Nenhum atendimento finalizado ainda.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {history.map((h) => (
              <li key={h.id} className="py-3 text-sm">
                <p className="font-medium">
                  {h.title} · {h.type}
                </p>
                <p className="text-[var(--muted)]">
                  {new Date(h.occurredAt).toLocaleString("pt-BR")}
                  {h.professionalName ? ` · ${h.professionalName}` : ""}
                </p>
                {h.nextDueAt ? (
                  <p className="mt-1 font-medium text-[var(--accent)]">
                    Próxima dose/retorno: {formatDateBr(h.nextDueAt)}
                  </p>
                ) : null}
                {h.body ? <p className="mt-1">{h.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function formatDateBr(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function formatDose(doseNumber) {
  if (doseNumber == null) return "Dose não informada";
  if (doseNumber === 0) return "Reforço";
  return `${doseNumber}ª dose`;
}

function vaccineHistory(history) {
  return history.filter((h) => h.type === "VACINA");
}

function lastOfType(history, type) {
  const item = history.find((h) => h.type === type);
  if (!item) return null;
  if (type === "VACINA") {
    const name = item.vaccineProductName || item.title;
    return `${name} · ${new Date(item.occurredAt).toLocaleDateString("pt-BR")}`;
  }
  return new Date(item.occurredAt).toLocaleDateString("pt-BR");
}

function nextDueFromHistory(history) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = history
    .filter((h) => h.nextDueAt)
    .map((h) => h.nextDueAt)
    .filter((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day) >= today;
    })
    .sort();
  return upcoming[0] ? formatDateBr(upcoming[0]) : null;
}

function SummaryItem({ label, value, hint }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
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
