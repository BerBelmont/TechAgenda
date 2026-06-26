import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  type?: ToastType;
  message: string;
  onClose?: () => void;
};

const toastTone: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand-200 bg-brand-50 text-brand-900'
};

const toastIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export const Toast = ({ type = 'info', message, onClose }: ToastProps) => {
  const Icon = toastIcon[type];

  return (
    <div
      className={`fixed right-4 top-20 z-[60] flex max-w-sm items-start gap-3 rounded-lg border p-4 text-sm font-semibold shadow-soft ${toastTone[type]}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="leading-6">{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-white/70"
          aria-label="Fechar mensagem"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
};
