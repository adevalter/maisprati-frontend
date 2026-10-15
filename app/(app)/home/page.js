"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";

const STATUS_LABEL = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateBr(isoDate) {
  if (!isoDate) return "";
  return isoDate.split("-").reverse().join("/");
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const current = getUser();
    setUser(current);
    loadShopData();
  }, []);

  async function loadShopData() {
    setError("");
    try {
      const token = getToken();
      setDashboard(await apiRequest("/api/dashboard/today", { token }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-[var(--muted)]">
        Carregando...
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {user.name}</h1>
      </header>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Agendamentos hoje" value={dashboard.todayCount} />
            <StatCard label="Aguardando" value={dashboard.waitingCount} />
            <StatCard label="Em atendimento" value={dashboard.inProgressCount} />
            <StatCard label="Domiciliares hoje" value={dashboard.homeVisitCount} />
            <StatCard
              label="Recebido hoje"
              value={formatPrice(dashboard.paidTodayCents || 0)}
            />
            <StatCard label="Pagamentos pendentes" value={dashboard.pendingPaymentCount || 0} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel title="Agenda de hoje" href="/appointments">
              {dashboard.todayAppointments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Nada agendado para hoje.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {dashboard.todayAppointments.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/appointments/${item.id}`}
                        className="flex justify-between gap-3 py-2.5 text-sm hover:text-[var(--accent)]"
                      >
                        <span>
                          <strong>{formatTime(item.scheduledAt)}</strong> · {item.petName} ·{" "}
                          {item.serviceName}
                        </span>
                        <span className="text-[var(--muted)]">
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Em atendimento">
              {dashboard.inProgress.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Nenhum atendimento em andamento.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {dashboard.inProgress.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/appointments/${item.id}`}
                        className="block py-2.5 text-sm hover:text-[var(--accent)]"
                      >
                        {item.petName} · {item.serviceName} · {item.clientName}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          <Panel title="Retornos e próximas doses (14 dias)">
            {dashboard.upcomingDue.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Nenhum retorno ou vacina com data próxima.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {dashboard.upcomingDue.map((item) => (
                  <li key={item.historyId}>
                    <Link
                      href={`/pets/${item.petId}`}
                      className="flex justify-between gap-3 py-2.5 text-sm hover:text-[var(--accent)]"
                    >
                      <span>
                        {item.petName} · {item.title}
                        {item.doseNumber != null
                          ? item.doseNumber === 0
                            ? " (reforço)"
                            : ` (dose ${item.doseNumber})`
                          : ""}
                      </span>
                      <span className="text-[var(--muted)]">
                        {formatDateBr(item.nextDueAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      ) : (
        <p className="text-[var(--muted)]">Carregando dashboard...</p>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Panel({ title, href, children }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm text-[var(--accent)] hover:underline">
            Ver tudo
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
