const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("en-US");

/** $4,000 for whole amounts, $673.91 otherwise. */
export function money(n: number, opts: { cents?: boolean } = {}) {
  const cents = opts.cents ?? !Number.isInteger(Math.round(n * 100) / 100);
  return (cents ? usd2 : usd0).format(n);
}

export const moneyCents = (n: number) => usd2.format(n);

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
/** $2,687 below $10K, $44.3K above: for tight table cells. */
export const moneyShort = (n: number) => (Math.abs(n) < 10_000 ? usd0.format(n) : usdCompact.format(n));
export const compactNumber = (n: number) => compact.format(n);
export const integer = (n: number) => int.format(Math.round(n));
export const percent = (n: number, digits = 0) => `${n.toFixed(digits)}%`;

export function moneyRange(low: number, high: number, cents = false) {
  return `${money(low, { cents })} – ${money(high, { cents })}`;
}

export function viewsRange(low: number, high: number) {
  return `${compactNumber(low)}–${compactNumber(high)}`;
}

/** Percent funded: whole numbers, but one decimal below 1% so a first small backing doesn't read as 0%. */
export function fundedPercent(amountFunded: number, target: number) {
  if (target <= 0 || amountFunded <= 0) return 0;
  const pct = (amountFunded / target) * 100;
  return pct < 1 ? Math.max(0.1, Math.round(pct * 10) / 10) : Math.min(100, Math.round(pct));
}

export function relativeDate(iso: string) {
  const diff = Date.now() - +new Date(iso);
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
