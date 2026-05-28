/** Format numeric strings as Uganda shillings (no decimals for display). */
export function formatUgx(amount: string | number | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("en-UG");
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (method === "mobile_money") return "Mobile money";
  if (method === "cash") return "Cash";
  return method ?? "—";
}
