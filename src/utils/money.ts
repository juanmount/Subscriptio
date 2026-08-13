import { getCurrencyMinorUnit } from '@/data/repositories/currencies';

const DEFAULT_MINOR_UNIT = 2;

function formatNumber(amount: number, minorUnit: number): string {
  const fixed = amount.toFixed(minorUnit);
  const [intPart, decPart] = fixed.split('.');
  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${withSeparators},${decPart}` : withSeparators;
}

export function toMinorUnits(amount: number, minorUnit: number = DEFAULT_MINOR_UNIT): number {
  return Math.round(amount * Math.pow(10, minorUnit));
}

export function fromMinorUnits(amountMinor: number, minorUnit: number = DEFAULT_MINOR_UNIT): number {
  return amountMinor / Math.pow(10, minorUnit);
}

export function formatCurrency(
  amountMinor: number,
  currencyCode: string,
  minorUnit?: number,
): string {
  const unit = minorUnit ?? getCurrencyMinorUnit(currencyCode);
  const amount = fromMinorUnits(amountMinor, unit);
  const formatted = formatNumber(amount, unit);
  return `${currencyCode} ${formatted}`;
}

export function parsePriceInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  let normalized: string;
  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = trimmed.replace(',', '.');
  } else if (hasDot) {
    const parts = trimmed.split('.');
    if (parts.length > 2) {
      normalized = parts.join('');
    } else {
      const lastPart = parts[1] ?? '';
      if (lastPart.length === 3 && parts[0].length <= 3) {
        normalized = parts.join('');
      } else {
        normalized = trimmed;
      }
    }
  } else {
    normalized = trimmed;
  }
  const value = parseFloat(normalized);
  if (isNaN(value) || value < 0) return null;
  return value;
}
