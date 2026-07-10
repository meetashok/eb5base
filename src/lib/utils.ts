import type { F956Status, SubscriptionStatus } from './types';
import { F956_OPTIONS, PROJECT_TYPES, SUBSCRIPTION_OPTIONS, TEA_OPTIONS } from './constants';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
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

export function f956Label(status: F956Status | string | null | undefined): string {
  return F956_OPTIONS.find((o) => o.value === status)?.label ?? 'Unknown';
}

export function subscriptionLabel(
  status: SubscriptionStatus | string | null | undefined
): string {
  return SUBSCRIPTION_OPTIONS.find((o) => o.value === status)?.label ?? 'Unknown';
}

export function teaLabel(value: string): string {
  return TEA_OPTIONS.find((o) => o.value === value)?.label ?? value.toUpperCase();
}

export function projectTypeLabel(value: string): string {
  return PROJECT_TYPES.find((o) => o.value === value)?.label ?? value;
}

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'ghost';

export function f956Variant(status: F956Status | string | null | undefined): BadgeVariant {
  switch (status) {
    case 'approved':
      return 'success';
    case 'denied':
      return 'error';
    case 'filed':
    case 'rfe':
    case 'rfe_response_submitted':
      return 'warning';
    case 'not_filed':
    case 'unknown':
    default:
      return 'ghost';
  }
}

export function subscriptionVariant(
  status: SubscriptionStatus | string | null | undefined
): BadgeVariant {
  switch (status) {
    case 'open':
      return 'success';
    case 'closed':
      return 'error';
    case 'not_yet_open':
    case 'unknown':
    default:
      return 'ghost';
  }
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
