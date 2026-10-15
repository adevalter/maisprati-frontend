export function formatPrice(cents) {
  const value = cents == null ? 0 : Number(cents);
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte string "45,90" ou "45.90" para centavos. */
export function reaisToCents(reais) {
  if (reais === "" || reais == null) return 0;
  const normalized = String(reais).trim().replace(/\s/g, "").replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function centsToReaisInput(cents) {
  if (cents == null) return "";
  return (Number(cents) / 100).toFixed(2).replace(".", ",");
}

export const PAYMENT_STATUS_LABEL = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ISENTO: "Isento",
};

export const PAYMENT_METHOD_LABEL = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Cartão débito",
  CARTAO_CREDITO: "Cartão crédito",
  OUTRO: "Outro",
};
