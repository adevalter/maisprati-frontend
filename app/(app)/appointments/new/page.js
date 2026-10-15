"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";

function toLocalInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [form, setForm] = useState({
    clientId: "",
    petId: "",
    serviceId: "",
    professionalId: "",
    scheduledAt: toLocalInputValue(),
    homeVisit: false,
    addressOverride: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiRequest("/api/clients", { token }),
      apiRequest("/api/services", { token }),
      apiRequest("/api/professionals", { token }),
    ])
      .then(([c, s, p]) => {
        setClients(c);
        setServices(s);
        setProfessionals(p);
      })
      .catch((err) => setError(err.message));
  }, [router]);

  useEffect(() => {
    if (!form.clientId) {
      setPets([]);
      setForm((prev) => ({ ...prev, petId: "" }));
      return;
    }
    apiRequest(`/api/pets?clientId=${form.clientId}`, { token: getToken() })
      .then((data) => {
        setPets(data);
        setForm((prev) => ({
          ...prev,
          petId: data.some((p) => String(p.id) === prev.petId) ? prev.petId : "",
        }));
      })
      .catch((err) => setError(err.message));
  }, [form.clientId]);

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
        petId: Number(form.petId),
        serviceId: Number(form.serviceId),
        professionalId: form.professionalId ? Number(form.professionalId) : null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        homeVisit: form.homeVisit,
        addressOverride: form.addressOverride || null,
        notes: form.notes || null,
      };
      const created = await apiRequest("/api/appointments", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify(body),
      });
      router.push(`/appointments/${created.id}`);
    } catch (err) {
      setError(err.message || "Falha ao agendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header>
        <Link href="/appointments" className="text-sm text-[var(--accent)] hover:underline">
          ← Agenda
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Novo agendamento</h1>
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
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
          >
            <option value="">Selecione</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Pet *</span>
          <select
            required
            disabled={!form.clientId}
            value={form.petId}
            onChange={(e) => updateField("petId", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 disabled:opacity-60"
          >
            <option value="">Selecione</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Serviço *</span>
          <select
            required
            value={form.serviceId}
            onChange={(e) => updateField("serviceId", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
          >
            <option value="">Selecione</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.extra}) — {formatPrice(s.priceCents)}
              </option>
            ))}
          </select>
        </label>

        {form.serviceId ? (
          <p className="rounded-lg bg-[var(--background)] px-3 py-2 text-sm">
            Valor do serviço:{" "}
            <strong>
              {formatPrice(
                services.find((s) => String(s.id) === String(form.serviceId))?.priceCents
              )}
            </strong>
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Profissional</span>
          <select
            value={form.professionalId}
            onChange={(e) => updateField("professionalId", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
          >
            <option value="">—</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Data e horário *</span>
          <input
            type="datetime-local"
            required
            value={form.scheduledAt}
            onChange={(e) => updateField("scheduledAt", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.homeVisit}
            onChange={(e) => updateField("homeVisit", e.target.checked)}
          />
          Atendimento domiciliar
        </label>

        {form.homeVisit ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Endereço do atendimento</span>
            <textarea
              value={form.addressOverride}
              onChange={(e) => updateField("addressOverride", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Observações</span>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Agendar"}
        </button>
      </form>
    </main>
  );
}
