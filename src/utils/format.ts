/**
 * Formatting utilities for display purposes.
 */

/**
 * Format a phone number for display. Currently passthrough;
 * the API stores various formats so we display as-is.
 */
export function formatPhone(phone: string): string {
  return phone;
}

/**
 * Format an ISO 8601 date string to a human-readable form.
 * Returns empty string for invalid dates.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
