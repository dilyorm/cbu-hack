import type { AssetStatus } from '../types';
import { statusColors, statusLabels } from '../utils/status';

interface Props {
  status: AssetStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${statusColors[status]} ${sizeClasses}`}>
      {statusLabels[status]}
    </span>
  );
}
