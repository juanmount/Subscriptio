import type { Frequency } from '@/domain/types';
import { t, tArray } from '@/i18n';

const MONTHS_ES = tArray('calendar.monthsShort');

export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  if (date.getFullYear() !== now.getFullYear()) {
    return `${day} ${month} ${date.getFullYear()}`;
  }
  return `${day} ${month}`;
}

export function nextRenewalDate(from: Date, frequency: Frequency): Date {
  const date = new Date(from);
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semiannual':
      date.setMonth(date.getMonth() + 6);
      break;
  }
  return date;
}

export function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case 'monthly': return t('freq.monthly');
    case 'yearly': return t('freq.yearly');
    case 'weekly': return t('freq.weekly');
    case 'quarterly': return t('freq.quarterly');
    case 'semiannual': return t('freq.semiannual');
  }
}
