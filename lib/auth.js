const TOKEN_KEY = "petshop_token";
const USER_KEY = "petshop_user";

export function saveSession(data) {
  if (typeof window === "undefined") return;
  const { token, ...user } = data;
  // Compat: sessão antiga usava petShopName
  if (!user.shopName && user.petShopName) {
    user.shopName = user.petShopName;
  }
  delete user.petShopName;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Sessão inválida/expirada: limpa storage e manda para o login. */
export function forceLogoutToLogin() {
  if (typeof window === "undefined") return;
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function redirectForRole() {
  return "/home";
}

export function roleLabel(role) {
  if (role === "PET_SHOP_ADMIN") return "Dono";
  if (role === "ATENDENTE") return "Atendente";
  return role;
}
