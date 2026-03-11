import type { AssetStatus } from '../types';

export const statusColors: Record<AssetStatus, string> = {
  REGISTERED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-green-100 text-green-800',
  IN_REPAIR: 'bg-yellow-100 text-yellow-800',
  LOST: 'bg-red-100 text-red-800',
  WRITTEN_OFF: 'bg-gray-100 text-gray-800',
};

export const statusLabels: Record<AssetStatus, string> = {
  REGISTERED: 'Registered',
  ASSIGNED: 'Assigned',
  IN_REPAIR: 'In Repair',
  LOST: 'Lost',
  WRITTEN_OFF: 'Written Off',
};

export const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatCurrency(amount?: number): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(amount);
}
