"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { roleLabel, getToken, getUser } from "@/lib/auth";
import { formatPrice, reaisToCents } from "@/lib/money";

const TABS = [
  { id: "team", label: "Equipe" },
  { id: "services", label: "Serviços" },
  { id: "professionals", label: "Profissionais" },
  { id: "vaccines", label: "Vacinas" },
];

const SERVICE_CATEGORIES = [
  "BANHO",
  "TOSA",
  "CONSULTA",
  "VACINA",
  "VERMIFUGO",
  "DOMICILIAR",
  "OUTRO",
];

const SPECIES_OPTIONS = [
  { value: "TODOS", label: "Todas espécies" },
  { value: "CAO", label: "Cão" },
  { value: "GATO", label: "Gato" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("team");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "BANHO",
    durationMin: "60",
    priceReais: "0,00",
  });

  const [professionals, setProfessionals] = useState([]);
  const [proForm, setProForm] = useState({ name: "", type: "BANHO_TOSA" });

  const [vaccines, setVaccines] = useState([]);
  const [vaccineForm, setVaccineForm] = useState({
    name: "",
    species: "TODOS",
    defaultIntervalDays: "365",
    recommendedDoses: "1",
  });

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "PET_SHOP_ADMIN") {
      router.replace("/home");
      return;
    }
    loadAll();
  }, [router]);

  async function loadAll() {
    setError("");
    const token = getToken();
    try {
      const [userList, serviceList, proList, vaccineList] = await Promise.all([
        apiRequest("/api/users", { token }),
        apiRequest("/api/services?all=true", { token }),
        apiRequest("/api/professionals?all=true", { token }),
        apiRequest("/api/vaccine-products?all=true", { token }),
      ]);
      setUsers(userList);
      setServices(serviceList);
      setProfessionals(proList);
      setVaccines(vaccineList);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/users", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify({ name, email, password }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setMessage("Atendente criado.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleUser(userId, active) {
    setError("");
    try {
      await apiRequest(`/api/users/${userId}/active`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({ active }),
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createService(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const priceCents = reaisToCents(serviceForm.priceReais);
    if (priceCents == null) {
      setError("Preço inválido.");
      return;
    }
    try {
      await apiRequest("/api/services", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify({
          name: serviceForm.name,
          category: serviceForm.category,
          durationMin: Number(serviceForm.durationMin),
          priceCents,
        }),
      });
      setServiceForm({ name: "", category: "BANHO", durationMin: "60", priceReais: "0,00" });
      setMessage("Serviço criado.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleService(id, active) {
    try {
      await apiRequest(`/api/services/${id}`, {
        method: "PUT",
        token: getToken(),
        body: JSON.stringify({ active }),
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createProfessional(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/professionals", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify(proForm),
      });
      setProForm({ name: "", type: "BANHO_TOSA" });
      setMessage("Profissional criado.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleProfessional(id, active) {
    try {
      await apiRequest(`/api/professionals/${id}`, {
        method: "PUT",
        token: getToken(),
        body: JSON.stringify({ active }),
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createVaccine(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/vaccine-products", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify({
          name: vaccineForm.name,
          species: vaccineForm.species,
          defaultIntervalDays: Number(vaccineForm.defaultIntervalDays),
          recommendedDoses: Number(vaccineForm.recommendedDoses),
        }),
      });
      setVaccineForm({
        name: "",
        species: "TODOS",
        defaultIntervalDays: "365",
        recommendedDoses: "1",
      });
      setMessage("Vacina cadastrada.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleVaccine(id, active) {
    try {
      await apiRequest(`/api/vaccine-products/${id}`, {
        method: "PUT",
        token: getToken(),
        body: JSON.stringify({ active }),
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-2 text-[var(--muted)]">
          Equipe, catálogo e carteira de vacinas da loja.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setMessage("");
              setError("");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === item.id
                ? "bg-[var(--accent)] text-white"
                : "hover:bg-black/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}

      {tab === "team" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Criar atendente</h2>
            <form onSubmit={handleCreateUser} className="mt-4 grid gap-3">
              <input
                required
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                required
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Senha (mín. 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Criar conta
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Usuários da loja</h2>
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {users.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[var(--muted)]">
                      {item.email} · {roleLabel(item.role)} ·{" "}
                      {item.active ? "ativo" : "inativo"}
                    </p>
                  </div>
                  {item.role === "ATENDENTE" ? (
                    <button
                      type="button"
                      onClick={() => toggleUser(item.id, !item.active)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                    >
                      {item.active ? "Desativar" : "Ativar"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "services" ? (
        <CatalogSection
          title="Serviços"
          form={
            <form onSubmit={createService} className="grid gap-3 sm:grid-cols-4">
              <input
                required
                placeholder="Nome"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2 sm:col-span-2"
              />
              <select
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                required
                type="number"
                min={5}
                placeholder="Minutos"
                value={serviceForm.durationMin}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, durationMin: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                required
                placeholder="Preço (R$)"
                value={serviceForm.priceReais}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, priceReais: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2 sm:col-span-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white sm:col-span-4 sm:w-fit"
              >
                Adicionar serviço
              </button>
            </form>
          }
          items={services}
          renderMeta={(item) =>
            `${item.category}${item.durationMin != null ? ` · ${item.durationMin} min` : ""} · ${formatPrice(
              item.priceCents
            )} · ${item.active ? "ativo" : "inativo"}`
          }
          onToggle={(item) => toggleService(item.id, !item.active)}
        />
      ) : null}

      {tab === "professionals" ? (
        <CatalogSection
          title="Profissionais"
          form={
            <form onSubmit={createProfessional} className="grid gap-3 sm:grid-cols-3">
              <input
                required
                placeholder="Nome"
                value={proForm.name}
                onChange={(e) => setProForm({ ...proForm, name: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2 sm:col-span-2"
              />
              <select
                value={proForm.type}
                onChange={(e) => setProForm({ ...proForm, type: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <option value="BANHO_TOSA">Banho/Tosa</option>
                <option value="VETERINARIO">Veterinário</option>
                <option value="OUTRO">Outro</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white sm:col-span-3 sm:w-fit"
              >
                Adicionar profissional
              </button>
            </form>
          }
          items={professionals}
          renderMeta={(item) =>
            `${item.type || item.extra || "—"} · ${item.active ? "ativo" : "inativo"}`
          }
          onToggle={(item) => toggleProfessional(item.id, !item.active)}
        />
      ) : null}

      {tab === "vaccines" ? (
        <CatalogSection
          title="Vacinas da loja"
          form={
            <form onSubmit={createVaccine} className="grid gap-3 sm:grid-cols-4">
              <input
                required
                placeholder="Nome (ex.: Antirrábica)"
                value={vaccineForm.name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2 sm:col-span-2"
              />
              <select
                value={vaccineForm.species}
                onChange={(e) => setVaccineForm({ ...vaccineForm, species: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                required
                type="number"
                min={1}
                placeholder="Intervalo (dias)"
                value={vaccineForm.defaultIntervalDays}
                onChange={(e) =>
                  setVaccineForm({ ...vaccineForm, defaultIntervalDays: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <input
                required
                type="number"
                min={1}
                placeholder="Doses recomendadas"
                value={vaccineForm.recommendedDoses}
                onChange={(e) =>
                  setVaccineForm({ ...vaccineForm, recommendedDoses: e.target.value })
                }
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white sm:col-span-4 sm:w-fit"
              >
                Adicionar vacina
              </button>
            </form>
          }
          items={vaccines}
          renderMeta={(item) =>
            `${item.species || "TODOS"} · intervalo ${item.defaultIntervalDays}d · ${
              item.recommendedDoses
            } dose(s) · ${item.active ? "ativo" : "inativo"}`
          }
          onToggle={(item) => toggleVaccine(item.id, !item.active)}
        />
      ) : null}

      <p className="text-sm text-[var(--muted)]">
        <Link href="/home" className="text-[var(--accent)] hover:underline">
          Voltar ao início
        </Link>
      </p>
    </main>
  );
}

function CatalogSection({ title, form, items, renderMeta, onToggle }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{form}</div>
      </section>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum item cadastrado.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-[var(--muted)]">{renderMeta(item)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                >
                  {item.active ? "Desativar" : "Ativar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
