"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import {
  formatPrice,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  reaisToCents,
} from "@/lib/money";

const EXPENSE_CATEGORIES = [
  { value: "ALUGUEL", label: "Aluguel" },
  { value: "UTILIDADES", label: "Utilidades" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "SALARIO", label: "Salário" },
  { value: "IMPOSTO", label: "Imposto" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "OUTRO", label: "Outro" },
];

const EXPENSE_STATUS_LABEL = {
  ABERTA: "Aberta",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

function monthBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(last).padStart(2, "0")}`,
  };
}

function formatDateBr(iso) {
  if (!iso) return "—";
  if (iso.includes("T")) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }
  return iso.split("-").reverse().join("/");
}

export default function FinancePage() {
  const user = getUser();
  const isAdmin = user?.role === "PET_SHOP_ADMIN";
  const bounds = useMemo(() => monthBounds(), []);

  const [tab, setTab] = useState("receber");
  const [from, setFrom] = useState(bounds.from);
  const [to, setTo] = useState(bounds.to);
  const [recvStatus, setRecvStatus] = useState("PENDENTE");
  const [payStatus, setPayStatus] = useState("ABERTA");
  const [receivables, setReceivables] = useState(null);
  const [payables, setPayables] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [payMethod, setPayMethod] = useState("PIX");
  const [payingId, setPayingId] = useState(null);

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "ALUGUEL",
    amountReais: "",
    dueDate: bounds.to,
    notes: "",
  });

  useEffect(() => {
    if (tab === "pagar" && !isAdmin) {
      setTab("receber");
      return;
    }
    load();
  }, [tab, from, to, recvStatus, payStatus, isAdmin]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (tab === "receber") {
        const q = new URLSearchParams({ from, to, status: recvStatus });
        setReceivables(await apiRequest(`/api/finance/receivables?${q}`, { token }));
      } else if (isAdmin) {
        const q = new URLSearchParams({ from, to, status: payStatus });
        setPayables(await apiRequest(`/api/finance/payables?${q}`, { token }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function receivePayment(appointmentId) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/finance/receivables/${appointmentId}/pay`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({ paymentMethod: payMethod }),
      });
      setPayingId(null);
      setMessage("Pagamento recebido.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createExpense(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const amountCents = reaisToCents(expenseForm.amountReais);
    if (amountCents == null) {
      setError("Valor inválido.");
      return;
    }
    try {
      await apiRequest("/api/finance/payables", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify({
          description: expenseForm.description,
          category: expenseForm.category,
          amountCents,
          dueDate: expenseForm.dueDate,
          notes: expenseForm.notes || null,
        }),
      });
      setExpenseForm({
        description: "",
        category: "ALUGUEL",
        amountReais: "",
        dueDate: bounds.to,
        notes: "",
      });
      setMessage("Conta a pagar criada.");
      setPayStatus("ABERTA");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function payExpense(id) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/finance/payables/${id}/pay`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({ paymentMethod: payMethod }),
      });
      setPayingId(null);
      setMessage("Conta marcada como paga.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelExpense(id) {
    if (!window.confirm("Cancelar esta conta?")) return;
    setError("");
    try {
      await apiRequest(`/api/finance/payables/${id}/cancel`, {
        method: "PATCH",
        token: getToken(),
      });
      setMessage("Conta cancelada.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
        <p className="mt-2 text-[var(--muted)]">
          Contas a receber dos atendimentos e contas a pagar da loja.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
        <TabButton active={tab === "receber"} onClick={() => setTab("receber")}>
          A receber
        </TabButton>
        {isAdmin ? (
          <TabButton active={tab === "pagar"} onClick={() => setTab("pagar")}>
            A pagar
          </TabButton>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">De</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Até</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
          />
        </label>
        {tab === "receber" ? (
          <label className="text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select
              value={recvStatus}
              onChange={(e) => setRecvStatus(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            >
              <option value="PENDENTE">Pendentes</option>
              <option value="PAGO">Pagos</option>
              <option value="ISENTO">Isentos</option>
              <option value="ALL">Todos</option>
            </select>
          </label>
        ) : (
          <label className="text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            >
              <option value="ABERTA">Abertas</option>
              <option value="PAGA">Pagas</option>
              <option value="CANCELADA">Canceladas</option>
              <option value="ALL">Todas</option>
            </select>
          </label>
        )}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-[var(--muted)]">Carregando...</p>
      ) : tab === "receber" && receivables ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label="A receber" value={formatPrice(receivables.pendingCents)} />
            <Stat label="Recebido no período" value={formatPrice(receivables.paidCents)} />
            <Stat label="Qtd. pendentes" value={receivables.pendingCount} />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {receivables.items.length === 0 ? (
              <p className="p-6 text-sm text-[var(--muted)]">Nenhum item neste filtro.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {receivables.items.map((item) => (
                  <li key={item.appointmentId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.serviceName} · {formatPrice(item.amountCents)}
                      </p>
                      <p className="text-[var(--muted)]">
                        {formatDateBr(item.completedAt)} · {item.clientName} · {item.petName} ·{" "}
                        {PAYMENT_STATUS_LABEL[item.paymentStatus] || item.paymentStatus}
                        {item.paymentMethod
                          ? ` (${PAYMENT_METHOD_LABEL[item.paymentMethod]})`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/appointments/${item.appointmentId}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Abrir
                      </Link>
                      {item.paymentStatus === "PENDENTE" ? (
                        payingId === item.appointmentId ? (
                          <>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value)}
                              className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                            >
                              {Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>
                                  {l}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => receivePayment(item.appointmentId)}
                              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayingId(null)}
                              className="text-xs text-[var(--muted)]"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPayingId(item.appointmentId)}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                          >
                            Receber
                          </button>
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : tab === "pagar" && payables ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label="A pagar no período" value={formatPrice(payables.openCents)} />
            <Stat label="Pago no período" value={formatPrice(payables.paidCents)} />
            <Stat label="Vencidas (abertas)" value={payables.overdueCount} />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Nova conta a pagar</h2>
            <form onSubmit={createExpense} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Descrição"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2 sm:col-span-2"
              />
              <select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Valor (R$)"
                value={expenseForm.amountReais}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amountReais: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                required
                type="date"
                value={expenseForm.dueDate}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, dueDate: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                placeholder="Observações"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit"
              >
                Adicionar
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {payables.items.length === 0 ? (
              <p className="p-6 text-sm text-[var(--muted)]">Nenhuma conta neste filtro.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {payables.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.description} · {formatPrice(item.amountCents)}
                        {item.overdue ? (
                          <span className="ml-2 text-xs font-semibold text-[var(--danger)]">
                            Vencida
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[var(--muted)]">
                        Vence {formatDateBr(item.dueDate)} ·{" "}
                        {EXPENSE_CATEGORIES.find((c) => c.value === item.category)?.label ||
                          item.category}{" "}
                        · {EXPENSE_STATUS_LABEL[item.status] || item.status}
                        {item.paymentMethod
                          ? ` (${PAYMENT_METHOD_LABEL[item.paymentMethod]})`
                          : ""}
                      </p>
                    </div>
                    {item.status === "ABERTA" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {payingId === `e-${item.id}` ? (
                          <>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value)}
                              className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                            >
                              {Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>
                                  {l}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => payExpense(item.id)}
                              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayingId(null)}
                              className="text-xs text-[var(--muted)]"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setPayingId(`e-${item.id}`)}
                              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                            >
                              Pagar
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelExpense(item.id)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-[var(--danger)]"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${
        active ? "bg-[var(--accent)] text-white" : "hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
