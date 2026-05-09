// Currency conversion helpers. Rates expressed as: 1 unit of <code> = X EGP.
// Sourced from approximate official rates (Aug 2025); refresh periodically via /api/currency/rates.
const RATES_TO_EGP: Record<string, number> = {
  EGP: 1,
  SAR: 13.07, // 1 SAR ≈ 13.07 EGP
  AED: 13.33, // 1 AED ≈ 13.33 EGP
  USD: 49.0,  // 1 USD ≈ 49 EGP
  EUR: 53.2,  // 1 EUR ≈ 53.2 EGP
};

export function toEGP(amount: number, currency: string): number {
  const rate = RATES_TO_EGP[currency.toUpperCase()] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

export function fromEGP(amountEGP: number, currency: string): number {
  const rate = RATES_TO_EGP[currency.toUpperCase()] ?? 1;
  if (rate === 0) return amountEGP;
  return Math.round((amountEGP / rate) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
