import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const PageHeader = ({ eyebrow, title, description, action }: PageHeaderProps) => (
  <div className="flex flex-col gap-5 border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-base leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
    </div>
  </div>
);
