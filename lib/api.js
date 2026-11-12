import { forceLogoutToLogin } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function handleUnauthorized(response, hadToken) {
  // 401 com token enviado = sessão expirada / inválida → login
  if (response.status === 401 && hadToken) {
    forceLogoutToLogin();
    return true;
  }
  return false;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const hadToken = Boolean(options.token);
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (handleUnauthorized(response, hadToken)) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = data?.message || "Erro na requisição";
    throw new Error(message);
  }

  return data;
}

export async function downloadAuthenticatedFile(path, { token, fallbackFilename }) {
  const headers = {};
  const hadToken = Boolean(token);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (handleUnauthorized(response, hadToken)) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    let message = "Erro no download";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename || "arquivo.pdf";

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
