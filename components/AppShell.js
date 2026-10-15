"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearSession, getToken, getUser, saveSession } from "@/lib/auth";

const NAV = [
  { href: "/home", label: "Início" },
  { href: "/clients", label: "Tutores" },
  { href: "/pets", label: "Pets" },
  { href: "/appointments", label: "Agenda" },
  { href: "/finance", label: "Financeiro" },
];

function isActive(pathname, href) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(() => getUser());
  const [shopName, setShopName] = useState(
    () => getUser()?.shopName || "Pet Shop"
  );
  const isAdmin = user?.role === "PET_SHOP_ADMIN";

  useEffect(() => {
    const current = getUser();
    setUser(current);

    if (current?.shopName) {
      setShopName(current.shopName);
      return;
    }

    const token = getToken();
    if (!token) return;

    apiRequest("/api/shop", { token })
      .then((shop) => {
        const name = shop?.name || "Pet Shop";
        setShopName(name);
        if (current) {
          saveSession({ token, ...current, shopName: name });
          setUser(getUser());
        }
      })
      .catch(() => {
        setShopName("Pet Shop");
      });
  }, []);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--accent)]">
              {shopName}
            </p>
            <p className="truncate text-xs text-[var(--muted)]">{user?.name}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--foreground)] hover:bg-black/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                href="/settings"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(pathname, "/settings")
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--foreground)] hover:bg-black/5"
                }`}
              >
                Configurações
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
