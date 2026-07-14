import type { BadgeVariant } from './types';

export type { BadgeVariant };

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  // Prefer date-only strings without timezone shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(date + 'T12:00:00')
    : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Color coding for USCIS case statuses on the timeline */
export function caseStatusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return 'muted';
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('card was produced') || s.includes('oath')) {
    return 'success';
  }
  if (
    s.includes('rfe') ||
    s.includes('request for evidence') ||
    s.includes('denied') ||
    s.includes('rejected') ||
    s.includes('withdrawn') ||
    s.includes('unable') ||
    s.includes('not found') ||
    s.includes('invalid')
  ) {
    return s.includes('denied') || s.includes('rejected') ? 'error' : 'warning';
  }
  if (s.includes('actively reviewed') || s.includes('interview') || s.includes('transferred')) {
    return 'info';
  }
  if (s.includes('received') || s.includes('accepted')) {
    return 'muted';
  }
  return 'info';
}

export function filingQuarter(date: string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date + (date.length === 10 ? 'T12:00:00' : ''));
  if (Number.isNaN(d.getTime())) return null;
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q} ${d.getUTCFullYear()}`;
}
