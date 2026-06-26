import type { StatusServico } from '../types';

export const statusLabels: Record<StatusServico, string> = {
  Agendado: 'Agendado',
  'Equipamento recebido': 'Equipamento recebido',
  'Em avaliação': 'Em avaliação',
  'Aguardando aprovação': 'Aguardando aprovação',
  'Em reparo': 'Em reparo',
  'Pronto para retirada': 'Pronto para retirada',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado'
};

export const statusTone: Record<StatusServico, string> = {
  Agendado: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Equipamento recebido': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Em avaliação': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Aguardando aprovação': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Em reparo': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Pronto para retirada': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Finalizado: 'bg-slate-100 text-slate-700 ring-slate-200',
  Cancelado: 'bg-red-50 text-red-700 ring-red-200'
};

export const statusSteps: StatusServico[] = [
  'Agendado',
  'Equipamento recebido',
  'Em avaliação',
  'Aguardando aprovação',
  'Em reparo',
  'Pronto para retirada',
  'Finalizado'
];
