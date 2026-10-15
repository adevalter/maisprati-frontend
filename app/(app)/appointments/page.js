"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatPrice, PAYMENT_STATUS_LABEL } from "@/lib/money";

function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export default function AppointmentsPage() {
  const [day, setDay] = useState(todayLocal());
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load(day);
  }, [day]);

  async function load(selectedDay) {
    setLoading(true);
    setError("");
    try {
      setItems(
        await apiRequest(`/api/appointments?day=${selectedDay}`, { token: getToken() })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-2 text-[var(--muted)]">Atendimentos do dia selecionado.</p>
        </div>
        <Link
          href="/appointments/new"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Novo agendamento
        </Link>
      </header>

      <label className="flex items-center gap-3 text-sm">
        <span className="font-medium">Dia</span>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">
            Nenhum agendamento neste dia.{" "}
            <Link href="/appointments/new" className="text-[var(--accent)] hover:underline">
              Criar agendamento
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/appointments/${item.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-[var(--background)]"
                >
                  <div>
                    <p className="font-medium">
                      {formatTime(item.scheduledAt)} · {item.petName} ({item.clientName})
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.serviceName}
                      {item.professionalName ? ` · ${item.professionalName}` : ""}
                      {item.homeVisit ? " · Domiciliar" : ""}
                      {" · "}
                      {STATUS_LABEL[item.status] || item.status}
                      {item.amountCents != null ? ` · ${formatPrice(item.amountCents)}` : ""}
                      {item.paymentStatus
                        ? ` · ${PAYMENT_STATUS_LABEL[item.paymentStatus] || item.paymentStatus}`
                        : ""}
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
