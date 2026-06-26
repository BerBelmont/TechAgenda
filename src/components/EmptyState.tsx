import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
);
