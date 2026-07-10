import { describe, it, expect } from 'vitest';
import { formatServiceDate } from './format';

describe('formatServiceDate', () => {
  it('formats a valid ISO date string to DD/MM/YYYY', () => {
    expect(formatServiceDate('2026-06-15T10:00:00.000Z')).toBe('15/06/2026');
  });

  it('formats a date-only ISO string to DD/MM/YYYY', () => {
    expect(formatServiceDate('2026-01-01')).toBe('01/01/2026');
  });

  it('returns em dash when date is null', () => {
    expect(formatServiceDate(null)).toBe('—');
  });

  it('returns em dash when date is empty string', () => {
    expect(formatServiceDate('')).toBe('—');
  });

  it('returns em dash for invalid date string', () => {
    expect(formatServiceDate('not-a-date')).toBe('—');
  });
});
