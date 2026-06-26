import type { LucideIcon } from 'lucide-react';

type DashboardMetricProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export const DashboardMetric = ({ label, value, icon: Icon }: DashboardMetricProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    </div>
  </div>
);
