import { statusLabels, statusTone } from '../data/status';
import type { ServiceStatus } from '../types';

type StatusBadgeProps = {
  status: ServiceStatus;
};

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusTone[status]}`}>
    {statusLabels[status]}
  </span>
);
