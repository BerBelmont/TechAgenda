import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, UserRound } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { ServicoDetalhado } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

type ServiceCardProps = {
  service: ServicoDetalhado;
  showClient?: boolean;
};

export const ServiceCard = ({ service, showClient = false }: ServiceCardProps) => (
  <Link
    to={`/cliente/servico/${service.id}`}
    className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-brand-900">
            {service.equipamento.tipo} {service.equipamento.marca}
          </h3>
          <StatusBadge status={service.ordem.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">{service.equipamento.modelo}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand-600" aria-hidden="true" />
    </div>

    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
      {service.equipamento.descricaoProblema}
    </p>

    <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
      <span className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {formatDate(service.agendamento.data)}
      </span>
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {service.agendamento.horario}
      </span>
      <span className="font-semibold text-slate-700">{formatCurrency(service.ordem.valorOrcamento)}</span>
    </div>

    {showClient ? (
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">
        <UserRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {service.cliente.nome}
      </div>
    ) : null}
  </Link>
);
