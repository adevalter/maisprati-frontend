"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  centsToReaisInput,
  formatPrice,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  reaisToCents,
} from "@/lib/money";

const STATUS_LABEL = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  EM_ATENDIMENTO: "Em atendimento",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const NEXT_ACTIONS = {
  AGENDADO: [
    { status: "CONFIRMADO", label: "Confirmar" },
    { status: "EM_ATENDIMENTO", label: "Iniciar" },
    { status: "CANCELADO", label: "Cancelar" },
  ],
  CONFIRMADO: [
    { status: "EM_ATENDIMENTO", label: "Iniciar atendimento" },
    { status: "CANCELADO", label: "Cancelar" },
  ],
  EM_ATENDIMENTO: [
    { status: "FINALIZADO", label: "Finalizar" },
    { status: "CANCELADO", label: "Cancelar" },
  ],
};

const DUE_CATEGORIES = new Set(["VACINA", "VERMIFUGO", "CONSULTA"]);

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function defaultNextDue(category) {
  const days = category === "VACINA" ? 365 : category === "VERMIFUGO" ? 90 : 30;
  return addDaysIso(days);
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params.id;
  const [item, setItem] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextDueAt, setNextDueAt] = useState("");
  const [vaccineProductId, setVaccineProductId] = useState("");
  const [doseNumber, setDoseNumber] = useState("1");
  const [amountReais, setAmountReais] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAGO");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [showFinalizePanel, setShowFinalizePanel] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const data = await apiRequest(`/api/appointments/${id}`, { token });
      setItem(data);
      setAmountReais(centsToReaisInput(data.amountCents ?? data.servicePriceCents ?? 0));
      if (data.serviceCategory === "VACINA") {
        const list = await apiRequest("/api/vaccine-products", { token });
        setVaccines(list);
        if (list.length > 0) {
          setVaccineProductId(String(list[0].id));
          setNextDueAt(addDaysIso(list[0].defaultIntervalDays || 365));
          setDoseNumber("1");
        }
      } else if (DUE_CATEGORIES.has(data.serviceCategory)) {
        setNextDueAt(defaultNextDue(data.serviceCategory));
      } else {
        setNextDueAt("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onVaccineChange(productId) {
    setVaccineProductId(productId);
    const product = vaccines.find((v) => String(v.id) === String(productId));
    if (product) {
      setNextDueAt(addDaysIso(product.defaultIntervalDays || 365));
    }
  }

  function onActionClick(status) {
    if (status === "FINALIZADO") {
      setShowFinalizePanel(true);
      setError("");
      setMessage("");
      setAmountReais(centsToReaisInput(item.amountCents ?? item.servicePriceCents ?? 0));
      setPaymentStatus("PAGO");
      setPaymentMethod("PIX");
      return;
    }
    changeStatus(status);
  }

  async function changeStatus(status, extra = {}) {
    setError("");
    setMessage("");
    try {
      const updated = await apiRequest(`/api/appointments/${id}/status`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({ status, ...extra }),
      });
      setItem(updated);
      setShowFinalizePanel(false);
      setMessage(
        status === "FINALIZADO"
          ? "Atendimento finalizado e registrado."
          : `Status: ${STATUS_LABEL[status]}`
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmFinalize() {
    const amountCents = reaisToCents(amountReais);
    if (amountCents == null) {
      setError("Valor inválido.");
      return;
    }
    if (item.serviceCategory === "VACINA" && !vaccineProductId) {
      setError("Selecione a vacina aplicada.");
      return;
    }

    const payload = {
      paymentStatus,
      amountCents,
    };
    if (paymentStatus === "PAGO") {
      payload.paymentMethod = paymentMethod;
    }
    if (item.serviceCategory === "VACINA") {
      payload.vaccineProductId = Number(vaccineProductId);
      payload.doseNumber = doseNumber === "" ? null : Number(doseNumber);
    }
    if (DUE_CATEGORIES.has(item.serviceCategory) && nextDueAt) {
      payload.nextDueAt = nextDueAt;
    }

    await changeStatus("FINALIZADO", payload);
  }

  if (loading || !item) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-[var(--muted)]">
        {error || "Carregando..."}
      </main>
    );
  }

  const actions = NEXT_ACTIONS[item.status] || [];
  const needsDue = DUE_CATEGORIES.has(item.serviceCategory);
  const isVaccine = item.serviceCategory === "VACINA";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <Link href="/appointments" className="text-sm text-[var(--accent)] hover:underline">
          ← Agenda
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{item.serviceName}</h1>
        <p className="mt-1 text-[var(--muted)]">
          {STATUS_LABEL[item.status]} ·{" "}
          {new Date(item.scheduledAt).toLocaleString("pt-BR")}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {formatPrice(item.amountCents ?? item.servicePriceCents)}
          {item.paymentStatus ? (
            <span className="ml-2 text-sm font-medium text-[var(--muted)]">
              · {PAYMENT_STATUS_LABEL[item.paymentStatus] || item.paymentStatus}
              {item.paymentMethod
                ? ` (${PAYMENT_METHOD_LABEL[item.paymentMethod] || item.paymentMethod})`
                : ""}
            </span>
          ) : null}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Tutor</dt>
            <dd className="font-medium">
              <Link
                href={`/clients/${item.clientId}`}
                className="text-[var(--accent)] hover:underline"
              >
                {item.clientName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Pet</dt>
            <dd className="font-medium">
              <Link href={`/pets/${item.petId}`} className="text-[var(--accent)] hover:underline">
                {item.petName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Profissional</dt>
            <dd className="font-medium">{item.professionalName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Domiciliar</dt>
            <dd className="font-medium">{item.homeVisit ? "Sim" : "Não"}</dd>
          </div>
        </dl>
        {item.addressOverride ? (
          <p className="mt-4 text-[var(--muted)]">Endereço: {item.addressOverride}</p>
        ) : null}
        {item.notes ? <p className="mt-4">Obs.: {item.notes}</p> : null}
      </section>

      {showFinalizePanel ? (
        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold">Finalizar atendimento</h2>

          {isVaccine ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Vacina *</span>
                <select
                  required
                  value={vaccineProductId}
                  onChange={(e) => onVaccineChange(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
                >
                  {vaccines.length === 0 ? (
                    <option value="">Nenhuma vacina cadastrada</option>
                  ) : (
                    vaccines.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.species}) · {v.defaultIntervalDays}d
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Dose</span>
                <select
                  value={doseNumber}
                  onChange={(e) => setDoseNumber(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
                >
                  <option value="1">1ª dose</option>
                  <option value="2">2ª dose</option>
                  <option value="3">3ª dose</option>
                  <option value="0">Reforço</option>
                </select>
              </label>
            </>
          ) : null}

          {needsDue ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Próxima dose / retorno</span>
              <input
                type="date"
                value={nextDueAt}
                onChange={(e) => setNextDueAt(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
              />
            </label>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Valor (R$) *</span>
            <input
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Pagamento *</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
            >
              <option value="PAGO">Pago agora</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ISENTO">Isento</option>
            </select>
          </label>

          {paymentStatus === "PAGO" ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Forma de pagamento *</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5"
              >
                {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmFinalize}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Confirmar finalização
            </button>
            <button
              type="button"
              onClick={() => setShowFinalizePanel(false)}
              className="rounded-lg px-4 py-2 text-sm text-[var(--muted)]"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {actions.length > 0 && !showFinalizePanel ? (
        <section className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => onActionClick(action.status)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                action.status === "CANCELADO"
                  ? "border border-red-200 text-[var(--danger)]"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
              }`}
            >
              {action.label}
              {action.status === "FINALIZADO" ? "…" : ""}
            </button>
          ))}
        </section>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
    </main>
  );
}
